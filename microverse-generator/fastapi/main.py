import subprocess
import traceback
from fastapi import FastAPI, File, HTTPException, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import aiofiles
import librosa
import os
import zipfile
import mingus.core.intervals as intervals
import mingus.core.notes as notes
import mingus.core.scales as scales
import mingus.core.chords as chords
import mingus.core.progressions as progressions
import mingus.core.keys as keys
from mingus.containers import Note, NoteContainer, Bar, Track, Composition
from unidecode import unidecode

import json

app = FastAPI()

CHORD = {
    'I': {},
    '1MIN': {},
    'I7': {},
    '1MIN7': {},
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] to allow all
    allow_credentials=True,
    allow_methods=["*"],  # or list only what you need, e.g., ["GET", "POST"]
    allow_headers=["*"],
)

CHORD_FUNCTIONS = {
    'M': lambda key: chords.major_triad(key),
    'm': lambda key: chords.minor_triad(key),
    'aug': lambda key: chords.augmented_triad(key),
    '+': lambda key: chords.augmented_triad(key),
    'dim': lambda key: chords.diminished_triad(key),
    'dim7': lambda key: chords.diminished_seventh(key),
    'sus2': lambda key: chords.suspended_second_triad(key),
    'sus': lambda key: chords.suspended_fourth_triad(key),
    '7b5': lambda key: chords.dominant_flat_five(key),
    '6': lambda key: chords.major_sixth(key),
    'M6': lambda key: chords.major_sixth(key),
    'm6': lambda key: chords.minor_sixth(key),
    '67': lambda key: chords.dominant_sixth(key),
    '69': lambda key: chords.sixth_ninth(key),
    '7': lambda key: chords.major_seventh(key),
    'M7': lambda key: chords.major_seventh(key),
    'm7': lambda key: chords.minor_seventh(key),
    'M7+': lambda key: chords.augmented_major_seventh(key),
    'm7+': lambda key: chords.augmented_minor_seventh(key),
    'm7+5': lambda key: chords.augmented_minor_seventh(key),
    'sus47': lambda key: chords.suspended_seventh(key),
    '7sus4': lambda key: chords.suspended_seventh(key),
    'm7b5': lambda key: chords.half_diminished_seventh(key),
    'dom7': lambda key: chords.dominant_seventh(key),
    'mM7': lambda key: chords.minor_major_seventh(key),
    '7+': lambda key: chords.augmented_major_seventh(key),
    '7#5': lambda key: chords.augmented_minor_seventh(key),
    '7#11': lambda key: chords.lydian_dominant_seventh(key),
    'M9': lambda key: chords.major_ninth(key),
    'm9': lambda key: chords.minor_ninth(key),
    'add9': lambda key: chords.dominant_ninth(key),
    '9': lambda key: chords.dominant_ninth(key),
    '7_#9': lambda key: chords.dominant_sharp_ninth(key),
    '7b9': lambda key: chords.dominant_flat_ninth(key),
    'susb9': lambda key: chords.suspended_fourth_ninth(key),
    'sus4b9': lambda key: chords.suspended_fourth_ninth(key),
    '6/9': lambda key: chords.sixth_ninth(key),
    '11': lambda key: chords.eleventh(key),
    'add11': lambda key: chords.eleventh(key),
    'm11': lambda key: chords.minor_eleventh(key),
    '7b12': lambda key: chords.hendrix_chord(key),
    'hendrix': lambda key: chords.hendrix_chord(key),
    'M13': lambda key: chords.major_thirteenth(key),
    'm13': lambda key: chords.minor_thirteenth(key),
    '13': lambda key: chords.dominant_thirteenth(key)
}

SCALE_CLASSES = {
    "Major": scales.Major,
    "Diatonic": scales.Major,
    "HarmonicMajor": scales.HarmonicMajor,
    "NaturalMinor": scales.NaturalMinor,
    "HarmonicMinor": scales.HarmonicMinor,
    "MelodicMinor": scales.MelodicMinor,
    "Bachian": scales.Bachian,
    "MinorNeapolitan": scales.MinorNeapolitan,
    "Chromatic": scales.Chromatic,
    "WholeTone": scales.WholeTone,
    "Octatonic": scales.Octatonic,
    "Ionian": scales.Ionian,
    "Dorian": scales.Dorian,
    "Phyrygian": scales.Phrygian,
    "Phrygian": scales.Phrygian,  # Typo in your original code?
    "Lydian": scales.Lydian,
    "Mixolydian": scales.Mixolydian,
    "Aeolian": scales.Aeolian,
    "Locrian": scales.Locrian,
}


def midi_name_to_num_helper(idx, scale):
    # print('OY OY ', scale)
    start = notes.note_to_int(scale[0])
    end = notes.note_to_int(scale[idx])
    note_num_in_key = end - start
    if (note_num_in_key < 0):
        note_num_in_key = note_num_in_key + 12
    # print('sanity note_num_in_key for midinametonum ', note_num_in_key)
    return note_num_in_key

def midi_name_to_num_prog_helper(idx, orig_start, scale):
    # print(idx, orig_start, scale)
    print("VEY VEY: ", orig_start, scale)
    start = notes.note_to_int(orig_start[0])
    end = notes.note_to_int(scale[idx])
    note_num_in_key = end - start
    # print('sanity note_num_in_key for proghelp ', note_num_in_key)
    if (note_num_in_key < 0):
        note_num_in_key = note_num_in_key + 12
    return note_num_in_key

scale_degree = ''
chord_method = None
def get_chord_method(idx, variation):
    if idx == 0 and variation == 0:
        scale_degree = 'I'
        chord_method = chords.major_triad
        # print('YO', str({'scale_degree': scale_degree, 'chord_method': chord_method}))
        return {'scale_degree': scale_degree, 'chord_method': chord_method}
    elif idx == 0 and variation == 1:
        scale_degree = '1MIN'
        chord_method = chords.minor_triad
        return {'scale_degree': scale_degree, 'chord_method': chord_method}
    elif idx == 0 and variation == 2:
        scale_degree = 'I7'
        app = FastAPI()
    elif idx == 5 and variation == 0:
        scale_degree = 'VI'
        chord_method = chords.VI
        return {'scale_degree': scale_degree, 'chord_method': chord_method}
    elif idx == 5 and variation == 1:
        scale_degree = '6MIN'
        chord_method = chords.vi
        return {'scale_degree': scale_degree, 'chord_method': chord_method}
    elif idx == 5 and variation == 2:
        scale_degree = 'VI7'
        chord_method = chords.VI7
        return {'scale_degree': scale_degree, 'chord_method': chord_method}
    elif idx == 5 and variation == 3:
        scale_degree = '6MIN7'
        chord_method = chords.vi7
        return {'scale_degree': scale_degree, 'chord_method': chord_method}
    elif idx == 6 and variation == 0:
        scale_degree = 'VII'
        chord_method = chords.VII
        return {'scale_degree': scale_degree, 'chord_method': chord_method}
    elif idx == 6 and variation == 1:
        scale_degree = '7MIN'
        chord_method = chords.vii
        return {'scale_degree': scale_degree, 'chord_method': chord_method}
    elif idx == 6 and variation == 2:
        scale_degree = 'VII7'
        chord_method = chords.VII7
        return {'scale_degree': scale_degree, 'chord_method': chord_method}
    elif idx == 6 and variation == 3:
        scale_degree = '7MIN7'
        chord_method = chords.vi7
        return {'scale_degree': scale_degree, 'chord_method': chord_method}
    
def progression_num_helper(note):
        # print('sanity check note is... ', note)
    if (note == 'D#'):
        note = 'Eb'
    if (note == 'G#'): 
        note = 'Ab'
    if (note == 'A#'): 
        note = 'Bb'
    ### FIRST / TONIC --------------------- //    
    ### SECOND / SUPERTONIC --------------------- //
    ### THIRD / MEDIANT --------------------- //
    ### FOURTH / SUBDOMINANT --------------------- //
    ### FIFTH / DOMINANT --------------------- //
    ### SIXTH / SUBMEDIANT --------------------- //
    ### SEVENTH / LEADING TONE - SUBTONIC ------ //
    # print('NOTE IS: ', note)
    for idx in range(0, 1):
        for variation in range(0, 4):
            cm = get_chord_method(idx, variation)
            if cm is None:
                continue
            chord_method = cm['chord_method']
            scale_degree = cm['scale_degree']  
            min_converter = scale_degree if 'MIN' not in scale_degree else scale_degree.replace('MIN', f'{get_chord_method(idx, 0)}'.lower())  
            if variation == 4:
                min_converter = min_converter + '7'
            for index, i in enumerate(chord_method(note)):
                if variation == 0:
                    CHORD[scale_degree]['MAJOR'] = []
                    CHORD[scale_degree]['MAJOR'].append(progressions.to_chords('I', key=note))
                    CHORD[scale_degree]['MINOR'] = []
                    CHORD[scale_degree]['MINOR'].append(chords.minor_triad(note))
                    CHORD[scale_degree]['MAJOR_SEVENTH'] = []
                    CHORD[scale_degree]['MAJOR_SEVENTH'].append(chords.major_seventh(note))
                if variation == 1:
                    CHORD[scale_degree]['MINOR'] = []
                    CHORD[scale_degree]['MINOR'].append(chords.minor_triad(note))
                if variation == 2:
                    # CHORD[scale_degree]['MAJOR_SEVENTH'].append(midi_name_to_num_prog_helper(index, chords.I(note[0]), chords.augmented_major_seventh(note[0])))
                    CHORD[scale_degree]['MAJOR_SEVENTH'] = []
                    CHORD[scale_degree]['MAJOR_SEVENTH'].append(chords.major_seventh(note))
                if variation == 3:
                    # CHORD[scale_degree]['MINOR_SEVENTH'].append(midi_name_to_num_prog_helper(index, chords.I(note[0]), chords.augmented_minor_seventh(note[0])))
                    CHORD[scale_degree]['MINOR_SEVENTH'] = []
                    CHORD[scale_degree]['MINOR_SEVENTH'].append(chords.minor_seventh(note))
                CHORD[scale_degree]['MAJ_SECOND'] = []
                CHORD[scale_degree]['MAJ_SECOND'].append(chords.major_seventh(i))
                CHORD[scale_degree]['MIN_SECOND'] = []
                CHORD[scale_degree]['MIN_SECOND'].append(chords.minor_seventh(i))
                    # CHORD[scale_degree]['MAJ_THIRD'].append(midi_name_to_num_prog_helper(index, chords.I(note[0]), intervals.major_third(i)))
                CHORD[scale_degree]['MAJ_THIRD'] = []
                CHORD[scale_degree]['MAJ_THIRD'].append(progressions.to_chords('III', key=note[0]))
                CHORD[scale_degree]['MIN_THIRD'] = []
                CHORD[scale_degree]['MIN_THIRD'].append(progressions.to_chords('iii7', key=note[0]))
                CHORD[scale_degree]['MAJ_FOURTH'] = []
                CHORD[scale_degree]['MAJ_FOURTH'].append(progressions.to_chords('IV', key=note[0]))
                CHORD[scale_degree]['PERFECT_FOURTH'] = []
                CHORD[scale_degree]['PERFECT_FOURTH'].append(intervals.perfect_fourth(note[0]))
                CHORD[scale_degree]['PERFECT_FIFTH'] = []
                CHORD[scale_degree]['PERFECT_FIFTH'].append(intervals.perfect_fifth(note[0]))
                CHORD[scale_degree]['MAJ_FIFTH'] = []
                CHORD[scale_degree]['MAJ_FIFTH'].append(progressions.to_chords('V', key=note[0]))
                CHORD[scale_degree]['MIN_FIFTH'] = []
                CHORD[scale_degree]['MIN_FIFTH'].append(progressions.to_chords('v', key=note[0]))
                CHORD[scale_degree]['MAJ_SIXTH'] = []
                CHORD[scale_degree]['MAJ_SIXTH'].append(progressions.to_chords('VI', key=note[0]))
                CHORD[scale_degree]['MIN_SIXTH'] = []
                CHORD[scale_degree]['MIN_SIXTH'].append(progressions.to_chords('vi', key=note[0]))
                CHORD[scale_degree]['MAJ_SEVENTH'] = []
                CHORD[scale_degree]['MAJ_SEVENTH'].append(progressions.to_chords('VII', key=note[0]))
                CHORD[scale_degree]['MIN_SEVENTH'] = []
                CHORD[scale_degree]['MIN_SEVENTH'].append(progressions.to_chords('vii', key=note[0]))
                CHORD[scale_degree]['INVERSION_1'] = []
                # print('I is ', chords.first_inversion(i))
                # CHORD[scale_degree]['INVERSION_1'].append(midi_name_to_num_prog_helper(index, chords.I(note[0]), chords.first_inversion(chord_method(note[0]))))
                # print('NOT NOTENOTW ', chord_method(note[0]))
                CHORD[scale_degree]['INVERSION_1'].append(chords.first_inversion(chord_method(note)))
                CHORD[scale_degree]['INVERSION_2'] = []
                CHORD[scale_degree]['INVERSION_2'].append(chords.second_inversion(chord_method(note)))
                CHORD[scale_degree]['INVERSION_3'] = []
                CHORD[scale_degree]['INVERSION_3'].append(chords.third_inversion(chord_method(note)))

                # if variation < 2 and idx != 0 and idx != 3 and idx != 4 and idx != 6:
                    # CHORD[scale_degree]['AUGMENTED'].append(midi_name_to_num_prog_helper(index, chords.I(note[0]), chords.augmented_triad(i)))
                CHORD[scale_degree]['AUGMENTED'] = []
                CHORD[scale_degree]['DIMINISHED'] = []
                # print('INDEX IS ', index)
                CHORD[scale_degree]['AUGMENTED'].append(chords.augmented_triad(note))
                CHORD[scale_degree]['DIMINISHED'].append(chords.diminished_triad(note))
            
                CHORD[scale_degree]['DOMINANT_SIXTH'] = []
                CHORD[scale_degree]['DOMINANT_SIXTH'].append(chords.dominant_sixth(note))
                CHORD[scale_degree]['HALF_DIMINISHED_SEVENTH'] = []
                CHORD[scale_degree]['HALF_DIMINISHED_SEVENTH'].append(chords.half_diminished_seventh(note[0]))
                CHORD[scale_degree]['SIXTH_NINTH'] = []
                CHORD[scale_degree]['SIXTH_NINTH'].append(chords.sixth_ninth(note))
                CHORD[scale_degree]['AUGMENTED_MAJ_SEVENTH'] = []
                CHORD[scale_degree]['AUGMENTED_MAJ_SEVENTH'].append(chords.augmented_major_seventh(note[0]))
                CHORD[scale_degree]['AUGMENTED_MIN_SEVENTH'] = []
                CHORD[scale_degree]['AUGMENTED_MIN_SEVENTH'].append(chords.augmented_minor_seventh(note[0]))
                CHORD[scale_degree]['LYDIAN_DOMINANT_SEVENTH'] = []
                CHORD[scale_degree]['LYDIAN_DOMINANT_SEVENTH'].append(chords.lydian_dominant_seventh(note[0]))
                CHORD[scale_degree]['MAJOR_NINTH'] = []
                CHORD[scale_degree]['MAJOR_NINTH'].append(chords.major_ninth(note))
                CHORD[scale_degree]['MINOR_NINTH'] = []
                CHORD[scale_degree]['MINOR_NINTH'].append(chords.minor_ninth(note))
                CHORD[scale_degree]['DOMINANT_NINTH'] = []
                CHORD[scale_degree]['DOMINANT_NINTH'].append(chords.dominant_ninth(note))
                CHORD[scale_degree]['DOMINANT_SHARP_NINTH'] = []
                CHORD[scale_degree]['DOMINANT_SHARP_NINTH'].append(chords.dominant_sharp_ninth(note))
                CHORD[scale_degree]['DOMINANT_FLAT_NINTH'] = []
                CHORD[scale_degree]['DOMINANT_FLAT_NINTH'].append(chords.dominant_flat_ninth(note))
##                if variation < 2 and idx != 0 and idx != 3 and idx != 4 and idx != 6:
                CHORD[scale_degree]['MAJOR_ELEVENTH'] = []
                CHORD[scale_degree]['MAJOR_ELEVENTH'].append(chords.eleventh(note))
                CHORD[scale_degree]['MINOR_ELEVENTH'] = []
                CHORD[scale_degree]['MINOR_ELEVENTH'].append(chords.minor_eleventh(note))
                CHORD[scale_degree]['CHORDS_HENDRIX'] = []
                CHORD[scale_degree]['CHORDS_HENDRIX'].append(chords.hendrix_chord(note))
                CHORD[scale_degree]['DOMINANT_THIRTEENTH'] = []
                CHORD[scale_degree]['DOMINANT_THIRTEENTH'].append(chords.dominant_thirteenth(note))
                CHORD[scale_degree]['MAJOR_THIRTEENTH'] = []
                CHORD[scale_degree]['MAJOR_THIRTEENTH'].append(chords.major_thirteenth(note))
                CHORD[scale_degree]['MINOR_THIRTEENTH'] = []
                CHORD[scale_degree]['MINOR_THIRTEENTH'].append(chords.minor_thirteenth(note))
                CHORD[scale_degree]['SUSPENDED_TRIAD'] = []
                CHORD[scale_degree]['SUSPENDED_TRIAD'].append(chords.suspended_triad(note))
                CHORD[scale_degree]['SUSPENDED_SECOND_TRIAD'] = []
                CHORD[scale_degree]['SUSPENDED_SECOND_TRIAD'].append(chords.suspended_second_triad(note))
                CHORD[scale_degree]['SUSPENDED_FOURTH_TRIAD'] = []
                CHORD[scale_degree]['SUSPENDED_FOURTH_TRIAD'].append(chords.suspended_fourth_triad(note))
                CHORD[scale_degree]['SUSPENDED_SEVENTH'] = []
                CHORD[scale_degree]['SUSPENDED_SEVENTH'].append(chords.suspended_seventh(note))
                CHORD[scale_degree]['SUSPENDED_FOURTH_NINTH'] = []
                CHORD[scale_degree]['SUSPENDED_FOURTH_NINTH'].append(chords.suspended_triad(note))

    # # print('sanity check note is... ', note)
    # if (note == 'D#'):
    #     note = 'Eb'
    # if (note == 'G#'): 
    #     note = 'Ab'
    # if (note == 'A#'): 
    #     note = 'Bb'
    return {
        'progs': {
            'I': chords.I(note),
            'I7': chords.I7(note),
            'II': chords.II(note),
            'II7': chords.II7(note),
            'III': chords.III(note),
            'III7': chords.III7(note),
            'IV': chords.IV(note),
            'IV7': chords.IV7(note),
            'V': chords.V(note),
            'V7': chords.V7(note),
            'VI': chords.VI(note),
            'VI7': chords.VI7(note),
            'VII': chords.VII(note),
            'VII7': chords.VII7(note),
        },
        'progs_nums': CHORD
    }

# @app.route('/midi/<number>', methods=['POST', 'GET'])
# def midi(number):
#     print('what is NUM>>> ', number)
#     print('what is typeof num? ', type(number))
#     dynamic_key = request.args.get("key")
#     if(number and int(number) < 128):
#         print("wtf ", int(number))
#         # lib_note = librosa.midi_to_note(int(number), octave=True, cents=False, key=dynamic_key, unicode=False)
#         lib_note = librosa.midi_to_note(int(number), unicode=True)
#         lib_hz = librosa.midi_to_hz(int(number))
        
#         print("NUMBER: ", number)
#         return {"midiNote": lib_note, "midiHz": lib_hz}


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/mingus_chords")
async def mingus_chords(request: Request):
    try:
        data = await request.json()
        print("mingus_chords data: ", data)

        key = unidecode(data.get("audioKey") or data.get("theNote") or "C").replace("♯", "#")
        chord_type = data.get("audioChord")

        print("Parsed key: ", key, "| Chord type: ", chord_type)

        print("Chord type received: ", chord_type)
        print("Available chord functions: ", CHORD_FUNCTIONS.keys())


        if chord_type == 'M':
            nums_chords = []
            chord_notes = chords.major_triad(key)
            for idx, note in enumerate(chord_notes):
                midi_val = midi_name_to_num_helper(idx, chord_notes)
                prog_val = progression_num_helper(key)
                if prog_val not in nums_chords:
                    nums_chords.append(prog_val)
            return json.dumps(nums_chords)

        if chord_type in CHORD_FUNCTIONS:
            nums_chords = []
            chord_notes = CHORD_FUNCTIONS[chord_type](key)
            for idx, note in enumerate(chord_notes):
                midi_val = midi_name_to_num_helper(idx, chord_notes)
                prog_val = progression_num_helper(key)
                if prog_val not in nums_chords:
                    nums_chords.append(prog_val)
            return json.dumps(nums_chords)

        return {"error": f"Unsupported chord type: {chord_type}"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mingus_scales")
async def mingus_scales(request: Request):
    try:
        data = await request.json()
        key = unidecode(data.get("audioKey") or data.get("theNote") or "C").replace("♯", "#")
        scale_type = data.get("audioScale")
        print("Received scale request: ", key, "|", scale_type)

        # Normalize enharmonics
        enharmonic_map = {'D#': 'Eb', 'G#': 'Ab', 'A#': 'Bb'}
        key = enharmonic_map.get(key, key)

        if not notes.is_valid_note(key):
            return {"error": f"{key} is not a valid note!"}

        if scale_type in SCALE_CLASSES:
            scale_class = SCALE_CLASSES[scale_type](key)
            ascending = scale_class.ascending()
            descending = scale_class.descending()
            return {
                "data": [
                    ascending,
                    descending,
                    [midi_name_to_num_helper(i, ascending) for i in range(len(ascending))],
                    [midi_name_to_num_helper(i, descending) for i in range(len(descending))]
                ]
            }
        elif scale_type == "Fifths":
            ascending = notes.fifths(key).ascending()
            descending = notes.fifths(key).descending()
            return {"data": [ascending, descending]}
        else:
            return {"error": f"Unsupported scale type: {scale_type}"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    



@app.post('/transpose_sample')
async def transpose_sample(request: Request):
    try:
        data = await request.json()
        file_path = data.get("file_path")
        print("File path received: ", file_path, flush=True)
        # file_path = data["file_path"]
        # pitch_shift_steps = data.get("pitch_shift", 12)  # e.g., +2 for up 2 semitones
        # rate_multiplier = data.get("rate_shift", 1.0)   # e.g., 1.2 for faster, 0.8 for slower

        # if not os.path.exists(file_path):
        #     return {"error": "File does not exist"}

        y, sr = librosa.load(file_path, sr=None)
        print(f"Loaded {file_path}: {len(y)} samples at {sr} Hz")

        # # Apply pitch shift (without speed change)
        # y_shifted = librosa.effects.pitch_shift(y, sr, n_steps=pitch_shift_steps)

        # # Apply rate change (resampling to new sample rate)
        # new_sr = int(sr * rate_multiplier)
        # y_resampled = librosa.resample(y_shifted, orig_sr=sr, target_sr=new_sr)

        # # Save to new file
        # output_path = file_path.replace(".wav", f"_shifted.wav")
        # sr.write(output_path, y_resampled, new_sr)

        # return {
        #     "status": "success",
        #     "output_file": output_path,
        #     "new_sample_rate": new_sr,
        #     "samples": len(y_resampled)
        # }
        return {"data": data, "y": y, "sr": sr}
    except Exception as e:
        traceback.print_exc()
        return HTTPException(status_code=500, detail=str(e)) 

@app.post("/analyze_audio")
async def analyze_audio(file: UploadFile = File(...)):
    try:
        # Check if the file is a WAV file
        if not file.filename.endswith('.wav'):
            return JSONResponse({"error": "Only WAV files are supported"}, status_code=400)

        # Create a temporary directory if it doesn't exist
        temp_dir = "temp_uploads"
        print("Temp dir: ", temp_dir)
        os.makedirs(temp_dir, exist_ok=True)

        # Save the file to a temporary location
        temp_file_path = f"{temp_dir}/{file.filename}"
        print("Temporary file path: ", temp_file_path)
        async with aiofiles.open(temp_file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)

        # Verify FFmpeg availability
        try:
            subprocess.check_output(["ffmpeg", "-version"])
        except FileNotFoundError:
            return JSONResponse({"error": "FFmpeg is not installed or not in the system's PATH"}, status_code=500)

        # Run Demucs source separation via CLI
        command = f"demucs --mp3 {temp_file_path}"
        print("Running command: ", command)
        subprocess.check_output(command, shell=True)

        # Package separated stems into a zip
        stem_path = f"{temp_file_path}/{file.filename}"
        zip_path = f"{stem_path}.zip"

        with zipfile.ZipFile(zip_path, "w") as zipf:
            for root, _, files in os.walk(stem_path):
                for f in files:
                    full_path = os.path.join(root, f)
                    arcname = f
                    zipf.write(full_path, arcname)

        return FileResponse(zip_path, media_type='application/zip', filename=f"{file.filename}_stems.zip")
    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"demucs error": str(e)}, status_code=500)

