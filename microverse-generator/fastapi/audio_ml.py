"""
Advanced Audio Machine Learning Module
Features: Genre Classification, Emotion Recognition, Audio Similarity, and More

Think of this like a comprehensive React component library, but for audio analysis!
Instead of UI components, we're building ML components for sound processing.
"""

# ===== IMPORT SECTION =====
# In Python, we import libraries at the top (like import statements in React)
# But Python imports are more like "import everything from this package"

import numpy as np  # Think of this like a super-powered array library
                    # Similar to JavaScript arrays, but with math operations built-in
                    # np.array([1,2,3]) creates an array, like [1,2,3] in JS

import pandas as pd  # This is like Excel for Python - handles tabular data
                     # Similar to working with JSON arrays of objects in JS
                     # pd.DataFrame() creates a table, like a spreadsheet

import librosa  # Audio processing library - like Web Audio API but for Python
                # This is what we use to load, analyze, and manipulate sound files

# ===== VISUALIZATION IMPORTS =====
# These are for creating charts and graphs

try:
    import librosa.display  # Visualization tools for audio (like Chart.js for audio)
    import matplotlib.pyplot as plt  # Basic plotting library (like a simple Chart.js)
    import seaborn as sns  # Fancy statistical plots (like a premium Chart.js)
    MATPLOTLIB_AVAILABLE = True
    print("✅ Matplotlib visualization libraries loaded")
except ImportError:
    print("⚠️  Matplotlib not available - some visualizations will be disabled")
    MATPLOTLIB_AVAILABLE = False
    # Create dummy classes
    class plt:
        @staticmethod
        def figure(*args, **kwargs):
            return None
        @staticmethod
        def colorbar(*args, **kwargs):
            return None
        @staticmethod
        def title(*args, **kwargs):
            return None
        @staticmethod
        def tight_layout(*args, **kwargs):
            return None
        @staticmethod
        def savefig(*args, **kwargs):
            return None
        @staticmethod
        def close(*args, **kwargs):
            return None
    class sns:
        pass

try:
    import plotly.graph_objects as go  # Interactive plots (like D3.js)
    import plotly.express as px  # Easy plotly functions (like simplified D3.js)
    from plotly.subplots import make_subplots  # Multiple plots in one figure
    PLOTLY_AVAILABLE = True
    print("✅ Plotly visualization libraries loaded")
except ImportError:
    print("⚠️  Plotly not available - interactive visualizations will be disabled")
    PLOTLY_AVAILABLE = False
    # Create dummy classes
    class go:
        @staticmethod
        def Scatter(*args, **kwargs):
            return None
        @staticmethod
        def Heatmap(*args, **kwargs):
            return None
    class make_subplots:
        @staticmethod
        def __call__(*args, **kwargs):
            return None

# ===== MACHINE LEARNING IMPORTS =====
# These are the "AI brain" libraries - think of them as pre-built algorithms

from sklearn.model_selection import train_test_split  # Splits data for training/testing
from sklearn.preprocessing import StandardScaler, LabelEncoder  # Data preparation tools
from sklearn.ensemble import RandomForestClassifier  # Decision tree algorithm
from sklearn.svm import SVC  # Support Vector Machine algorithm
from sklearn.neural_network import MLPClassifier  # Neural network algorithm
from sklearn.metrics import classification_report, confusion_matrix  # Performance metrics
from sklearn.decomposition import PCA  # Dimensionality reduction
from sklearn.cluster import KMeans  # Clustering algorithm

# ===== DEEP LEARNING IMPORTS =====
# These are for more complex AI models (like advanced neural networks)

try:
    import tensorflow as tf  # Google's deep learning framework
    from tensorflow import keras  # High-level API for TensorFlow (like React for DOM)
    from tensorflow.keras import layers  # Building blocks for neural networks
    TENSORFLOW_AVAILABLE = True
    print("✅ TensorFlow loaded successfully")
except ImportError:
    print("⚠️  TensorFlow not available - CNN features will be disabled")
    TENSORFLOW_AVAILABLE = False
    # Create dummy classes so the code doesn't break
    class tf:
        class image:
            @staticmethod
            def resize(data, size):
                return data
        @staticmethod
        def expand_dims(data, axis):
            return data
    class keras:
        class Sequential:
            def __init__(self, layers=None):
                self.layers = layers or []
        class models:
            @staticmethod
            def load_model(path):
                return None
    class layers:
        @staticmethod
        def Conv2D(*args, **kwargs):
            return None
        @staticmethod
        def MaxPooling2D(*args, **kwargs):
            return None
        @staticmethod
        def Flatten(*args, **kwargs):
            return None
        @staticmethod
        def Dense(*args, **kwargs):
            return None
        @staticmethod
        def Dropout(*args, **kwargs):
            return None

# ===== UTILITY IMPORTS =====
import joblib  # Saves/loads Python objects (like localStorage but for ML models)
import os  # File system operations (like Node.js fs module)
import json  # JSON handling (same as in JavaScript)
from typing import Dict, List, Tuple, Optional  # Type hints (like TypeScript types!)
import warnings  # Warning system
warnings.filterwarnings('ignore')  # Hide annoying warnings (like console.clear())

# ===== CLASS DEFINITION =====
# This is like defining a React component, but for audio analysis
# Instead of managing UI state, we're managing ML model state

class AudioMLAnalyzer:
    """
    Advanced Audio Machine Learning Analyzer
    
    Think of this like a React class component that manages:
    - Audio data processing (like state management)
    - ML model training (like complex business logic)
    - Prediction methods (like event handlers)
    """
    
    def __init__(self):
        """
        Constructor - runs when we create a new AudioMLAnalyzer instance
        Like componentDidMount() in React, but for initialization
        
        In Python, __init__ is like a constructor in JavaScript classes
        """
        
        # ===== DATA PREPROCESSING TOOLS =====
        # These are like utility functions that prepare data for ML
        
        self.scaler = StandardScaler()  # Normalizes data (like scaling 0-100 to 0-1)
                                       # Essential because ML algorithms work better with normalized data
                                       # Think of it like normalizing CSS values for responsive design
        
        self.label_encoder = LabelEncoder()  # Converts text labels to numbers
                                            # Like converting "rock", "jazz" to 0, 1, 2
                                            # ML algorithms need numbers, not text
        
        # ===== MODEL STORAGE =====
        # These are like state variables in React - they hold our trained models
        
        self.genre_model = None  # Will hold our trained genre classification model
        self.emotion_model = None  # Will hold our trained emotion recognition model  
        self.similarity_model = None  # Will hold our similarity matching model
        self.feature_names = []  # Will store the names of audio features we extract
        
    def extract_advanced_features(self, y: np.ndarray, sr: int) -> Dict:
        """
        Extract comprehensive audio features for ML analysis
        
        This is like creating a "profile" of the audio file
        Instead of analyzing pixels in an image, we're analyzing sound waves
        
        Parameters:
        - y: Audio data as numpy array (like audio samples in JavaScript)
        - sr: Sample rate (how many samples per second, like 44100 Hz)
        
        Returns:
        - Dict: Dictionary of features (like a JSON object with audio characteristics)
        """
        features = {}  # Empty dictionary to store our features (like {} in JavaScript)
        
        # ===== BASIC AUDIO PROPERTIES =====
        # These are like getting basic info about a file (size, type, etc.)
        
        features['duration'] = len(y) / sr  # Calculate duration in seconds
                                          # len(y) = number of samples, sr = samples per second
                                          # Like calculating video length: frames / fps
        
        features['sample_rate'] = sr  # Store the sample rate (usually 44100 Hz)
                                     # Like storing the resolution of an image
        
        # ===== SPECTRAL FEATURES =====
        # These describe the "color" or "timbre" of the sound
        # Like analyzing the color palette of an image
        
        # Spectral Centroid: The "brightness" of the sound
        # High values = bright/harsh sounds, Low values = dark/mellow sounds
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]  # Get centroid for each time frame
        features['spectral_centroid_mean'] = np.mean(spectral_centroids)  # Average brightness
        features['spectral_centroid_std'] = np.std(spectral_centroids)    # How much brightness varies
        
        # Spectral Rolloff: Where 85% of the energy is below this frequency
        # Tells us about the "sharpness" of the sound
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        features['spectral_rolloff_mean'] = np.mean(spectral_rolloff)  # Average rolloff point
        features['spectral_rolloff_std'] = np.std(spectral_rolloff)    # Variation in rolloff
        
        # Spectral Bandwidth: How "spread out" the frequencies are
        # Wide bandwidth = complex sounds, Narrow = simple sounds
        spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
        features['spectral_bandwidth_mean'] = np.mean(spectral_bandwidth)  # Average spread
        features['spectral_bandwidth_std'] = np.std(spectral_bandwidth)    # How much it varies
        
        # ===== RHYTHM AND TEXTURE FEATURES =====
        
        # Zero Crossing Rate: How often the signal crosses zero
        # High ZCR = noisy/percussive sounds (like drums)
        # Low ZCR = smooth sounds (like vocals or sustained notes)
        zcr = librosa.feature.zero_crossing_rate(y)[0]  # Calculate for each time frame
        features['zcr_mean'] = np.mean(zcr)  # Average "noisiness"
        features['zcr_std'] = np.std(zcr)    # How much noisiness varies over time
        
        # ===== MFCC FEATURES (Mel-Frequency Cepstral Coefficients) =====
        # These are like a "fingerprint" of the sound
        # Think of them as 13 numbers that describe the overall sound character
        # Similar to how a color can be described by RGB values
        
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)  # Extract 13 MFCC coefficients
        for i in range(13):  # Loop through each coefficient (0 to 12)
            features[f'mfcc_{i}_mean'] = np.mean(mfccs[i])  # Average value of this coefficient
            features[f'mfcc_{i}_std'] = np.std(mfccs[i])    # How much this coefficient varies
        
        # ===== CHROMA FEATURES =====
        # These represent the 12 musical notes (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
        # Like analyzing which colors are most prominent in an image
        # Useful for detecting musical key and harmony
        
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)  # Extract chroma for each time frame
        for i in range(12):  # Loop through all 12 musical notes
            features[f'chroma_{i}_mean'] = np.mean(chroma[i])  # How much this note appears on average
            features[f'chroma_{i}_std'] = np.std(chroma[i])    # How much this note varies over time
        
        # ===== RHYTHM FEATURES =====
        # These describe the timing and beat of the music
        # Like analyzing the rhythm of a dance or heartbeat
        
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)  # Find the tempo and beat locations
        features['tempo'] = tempo  # Beats per minute (like BPM in music software)
        features['beat_count'] = len(beats)  # Total number of beats detected
        
        # ===== ENERGY FEATURES =====
        # These describe how "loud" or "energetic" the sound is
        
        # RMS (Root Mean Square): Average energy level
        # Like measuring the average brightness of an image
        rms = librosa.feature.rms(y=y)[0]  # Calculate RMS for each time frame
        features['rms_mean'] = np.mean(rms)  # Average energy level
        features['rms_std'] = np.std(rms)    # How much energy varies over time
        
        # ===== SPECTRAL CONTRAST =====
        # This measures the difference between peaks and valleys in the frequency spectrum
        # Like measuring the contrast in a photograph - high contrast = sharp differences
        # Useful for distinguishing between harmonic (smooth) and percussive (sharp) sounds
        
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr)  # Extract contrast for 7 frequency bands
        for i in range(7):  # Loop through each frequency band
            features[f'contrast_{i}_mean'] = np.mean(contrast[i])  # Average contrast in this band
            features[f'contrast_{i}_std'] = np.std(contrast[i])    # How much contrast varies
        
        # ===== TONNETZ FEATURES =====
        # These represent harmonic relationships between musical notes
        # Like a 6-dimensional map of how notes relate to each other
        # Very useful for detecting musical key and chord progressions
        
        tonnetz = librosa.feature.tonnetz(y=y, sr=sr)  # Extract tonnetz features
        for i in range(6):  # Loop through the 6 tonnetz dimensions
            features[f'tonnetz_{i}_mean'] = np.mean(tonnetz[i])  # Average harmonic relationship
            features[f'tonnetz_{i}_std'] = np.std(tonnetz[i])    # How much relationships vary
        
        return features  # Return our complete feature dictionary (like returning a JSON object)
    
    def create_spectrogram_image(self, y: np.ndarray, sr: int, save_path: str = None) -> np.ndarray:
        """
        Create mel-spectrogram for CNN input
        
        A spectrogram is like a "picture" of sound - it shows how frequencies change over time
        Think of it like a heat map where:
        - X-axis = time (left to right)
        - Y-axis = frequency (low to high)
        - Color = intensity (dark = quiet, bright = loud)
        
        This is what we feed to our neural network for image-based audio analysis!
        """
        
        # ===== CREATE MEL-SPECTROGRAM =====
        # A mel-spectrogram is like a regular spectrogram, but optimized for human hearing
        # It focuses on frequencies that humans can hear best (like how our ears work)
        
        mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000)
        # n_mels=128: Split frequencies into 128 "mel bins" (like 128 horizontal strips)
        # fmax=8000: Only analyze up to 8000 Hz (most important for music)
        
        # Convert to decibels (logarithmic scale) - like adjusting brightness in a photo
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
        # This makes quiet sounds more visible (like increasing contrast)
        
        # ===== RESIZE FOR NEURAL NETWORK =====
        # Neural networks need consistent input sizes (like resizing images for a website)
        # We resize to 128x128 pixels so our CNN can process it
        
        mel_spec_resized = tf.image.resize(
            np.expand_dims(mel_spec_db, axis=-1),  # Add a "channel" dimension (like RGB channels)
            [128, 128]  # Resize to 128x128 pixels
        ).numpy()  # Convert back to numpy array
        
        # ===== OPTIONAL: SAVE VISUALIZATION =====
        # This creates a pretty picture we can look at (like saving a chart)
        
        if save_path:  # Only if user wants to save the image
            plt.figure(figsize=(10, 4))  # Create a figure (like creating a canvas)
            librosa.display.specshow(mel_spec_db, sr=sr, x_axis='time', y_axis='mel')
            # Display the spectrogram with proper labels
            
            plt.colorbar(format='%+2.0f dB')  # Add a color scale (like a legend)
            plt.title('Mel-Spectrogram')  # Add a title
            plt.tight_layout()  # Make it look nice (like CSS padding)
            plt.savefig(save_path, dpi=150, bbox_inches='tight')  # Save as image file
            plt.close()  # Clean up memory (like closing a file)
        
        return mel_spec_resized  # Return the resized spectrogram for our neural network
    
    def train_genre_classifier(self, audio_files: List[str], genres: List[str], model_type: str = 'cnn'):
        """
        Train a genre classification model
        
        This is like teaching a computer to recognize different types of music
        We give it examples: "This is rock", "This is jazz", "This is classical"
        Then it learns patterns and can classify new songs!
        
        Think of it like training a spam filter, but for music genres instead of emails.
        """
        print("🎵 Training Genre Classifier...")
        
        # ===== PREPARE TRAINING DATA =====
        # These are like empty arrays where we'll store our training examples
        
        X_features = []  # Will store traditional audio features (like a spreadsheet)
        X_spectrograms = []  # Will store spectrogram images (like a photo album)
        y_labels = []  # Will store the correct answers (like answer key)
        
        # ===== PROCESS EACH AUDIO FILE =====
        # This is like going through each example in our training set
        
        for i, (file_path, genre) in enumerate(zip(audio_files, genres)):
            # zip() pairs up files with their genres: [(file1, "rock"), (file2, "jazz")]
            # enumerate() gives us a counter: [(0, file1), (1, file2)]
            
            try:  # Try to process this file (like try/catch in JavaScript)
                # Load audio file (like loading an image in React)
                y, sr = librosa.load(file_path, duration=30)  # Limit to 30 seconds for consistency
                
                # Extract traditional features (like getting metadata from a file)
                features = self.extract_advanced_features(y, sr)
                X_features.append(list(features.values()))  # Convert dict to list
                
                # Create spectrogram image (like creating a thumbnail)
                spectrogram = self.create_spectrogram_image(y, sr)
                X_spectrograms.append(spectrogram)
                
                # Store the correct answer (like storing the label on a photo)
                y_labels.append(genre)
                
                # Show progress (like a loading bar)
                if (i + 1) % 10 == 0:
                    print(f"Processed {i + 1}/{len(audio_files)} files")
                    
            except Exception as e:  # If something goes wrong with this file
                print(f"Error processing {file_path}: {e}")
                continue  # Skip this file and move to the next one
        
        # ===== CONVERT TO NUMPY ARRAYS =====
        # Convert our Python lists to numpy arrays (like converting JS arrays to typed arrays)
        # This makes calculations much faster and more memory efficient
        
        X_features = np.array(X_features)  # Convert features list to numpy array
        X_spectrograms = np.array(X_spectrograms)  # Convert spectrograms list to numpy array
        y_encoded = self.label_encoder.fit_transform(y_labels)  # Convert text labels to numbers
        
        # Store feature names for later use (like keeping column names in a spreadsheet)
        self.feature_names = list(features.keys())
        
        # ===== CHOOSE MODEL TYPE =====
        # We can train either a CNN (for images) or traditional ML (for features)
        
        if model_type == 'cnn':
            # ===== CONVOLUTIONAL NEURAL NETWORK (CNN) =====
            # This is like teaching a computer to recognize patterns in images
            # We're treating spectrograms as images and finding patterns in them
            
            if not TENSORFLOW_AVAILABLE:
                print("❌ CNN training requires TensorFlow. Please install with: pip install tensorflow")
                return None
            
            model = keras.Sequential([  # Sequential = layers stacked one after another (like React components)
                
                # ===== CONVOLUTION LAYERS =====
                # These look for patterns in small patches of the image
                # Like looking for edges, shapes, textures in a photo
                
                layers.Conv2D(32, (3, 3), activation='relu', input_shape=(128, 128, 1)),
                # 32 filters, each 3x3 pixels, looking for 32 different patterns
                # input_shape=(128, 128, 1) = 128x128 pixels, 1 color channel (grayscale)
                
                layers.MaxPooling2D((2, 2)),  # Reduce image size by taking max value in 2x2 patches
                # Like reducing image resolution to focus on important features
                
                layers.Conv2D(64, (3, 3), activation='relu'),  # 64 filters for more complex patterns
                layers.MaxPooling2D((2, 2)),  # Reduce size again
                
                layers.Conv2D(64, (3, 3), activation='relu'),  # Even more complex patterns
                
                # ===== DENSE (FULLY CONNECTED) LAYERS =====
                # These make the final decision based on all the patterns found
                
                layers.Flatten(),  # Convert 2D image to 1D array (like flattening a nested array)
                layers.Dense(64, activation='relu'),  # 64 neurons for decision making
                layers.Dropout(0.5),  # Randomly turn off 50% of neurons during training (prevents overfitting)
                layers.Dense(len(np.unique(y_encoded)), activation='softmax')  # Final output layer
                # softmax ensures all outputs sum to 1 (like percentages that add up to 100%)
            ])
            
            # ===== COMPILE THE MODEL =====
            # This is like setting up the "rules" for how the model learns
            # Like configuring a React app before running it
            
            model.compile(
                optimizer='adam',  # How the model updates its weights (like learning rate)
                # Adam is like a smart learning algorithm that adjusts its speed automatically
                
                loss='sparse_categorical_crossentropy',  # How we measure "wrongness"
                # This measures how far off our predictions are from the correct answers
                # Like measuring how far off a dart throw is from the bullseye
                
                metrics=['accuracy']  # What we want to track during training
                # Accuracy = percentage of correct predictions (like a test score)
            )
            
            # ===== SPLIT DATA FOR TRAINING AND TESTING =====
            # We need to test our model on data it hasn't seen before
            # Like studying for a test, then taking the actual test
            
            X_train, X_test, y_train, y_test = train_test_split(
                X_spectrograms, y_encoded, test_size=0.2, random_state=42
            )
            # test_size=0.2 means 20% for testing, 80% for training
            # random_state=42 ensures we get the same split every time (like a seed)
            
            # ===== TRAIN THE MODEL =====
            # This is where the magic happens! The model learns from examples
            # Like a student studying flashcards over and over
            
            model.fit(X_train, y_train, epochs=20, batch_size=32, validation_data=(X_test, y_test))
            # epochs=20: Go through the training data 20 times (like studying 20 times)
            # batch_size=32: Process 32 examples at once (like studying in groups)
            # validation_data: Test on unseen data after each epoch (like practice tests)
            
            # ===== EVALUATE THE MODEL =====
            # See how well our model performs on completely new data
            
            test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
            print(f"CNN Test Accuracy: {test_acc:.4f}")  # Print the final test score
            
            self.genre_model = model  # Save our trained model for later use
            
        else:
            # ===== TRADITIONAL MACHINE LEARNING =====
            # Instead of using neural networks, we use simpler algorithms
            # Like using a calculator instead of a computer for simple math
            
            # Scale the features (normalize them to similar ranges)
            X_scaled = self.scaler.fit_transform(X_features)
            # This is like converting different currencies to the same currency
            # So all features have similar importance in the algorithm
            
            # Split data for training and testing (same as before)
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y_encoded, test_size=0.2, random_state=42
            )
            
            # ===== RANDOM FOREST CLASSIFIER =====
            # This creates many decision trees and combines their votes
            # Like asking 100 people to vote on what genre a song is
            # The majority vote wins!
            
            rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
            # n_estimators=100: Create 100 decision trees
            # random_state=42: Ensure reproducible results
            
            rf_model.fit(X_train, y_train)  # Train the model (like teaching the trees)
            rf_score = rf_model.score(X_test, y_test)  # Test accuracy
            print(f"Random Forest Accuracy: {rf_score:.4f}")
            
            self.genre_model = rf_model  # Save the trained model
        
        # ===== SAVE MODELS FOR LATER USE =====
        # Save everything so we don't have to retrain every time
        # Like saving a game progress so you can continue later
        
        self.save_models()
        return self.genre_model  # Return the trained model
    
    def predict_genre(self, audio_file: str) -> Dict:
        """
        Predict genre of an audio file
        
        This is like asking our trained model: "What genre is this song?"
        It's like using a trained expert to classify new music!
        """
        
        # ===== CHECK IF MODEL IS TRAINED =====
        if self.genre_model is None:
            return {"error": "Genre model not trained"}
            # Like checking if you've studied before taking a test
        
        try:  # Try to make a prediction
            # Load the audio file (like opening a file to read it)
            y, sr = librosa.load(audio_file, duration=30)
            
            # ===== CHOOSE PREDICTION METHOD BASED ON MODEL TYPE =====
            
            if hasattr(self.genre_model, 'predict_proba'):  # Traditional ML model
                # ===== TRADITIONAL ML PREDICTION =====
                # Extract features and use them for prediction
                
                features = self.extract_advanced_features(y, sr)  # Get audio features
                X = np.array([list(features.values())])  # Convert to array format
                X_scaled = self.scaler.transform(X)  # Scale features (same as training)
                
                probabilities = self.genre_model.predict_proba(X_scaled)[0]  # Get probability for each genre
                predicted_class = self.genre_model.predict(X_scaled)[0]  # Get the most likely genre
                
            else:  # CNN model
                # ===== CNN PREDICTION =====
                # Create spectrogram and use it for prediction
                
                spectrogram = self.create_spectrogram_image(y, sr)  # Create spectrogram image
                X = np.expand_dims(spectrogram, axis=0)  # Add batch dimension (like [image] instead of image)
                
                probabilities = self.genre_model.predict(X)[0]  # Get probabilities from neural network
                predicted_class = np.argmax(probabilities)  # Find the highest probability
            
            # ===== CONVERT RESULTS TO READABLE FORMAT =====
            
            genre = self.label_encoder.inverse_transform([predicted_class])[0]  # Convert number back to text
            confidence = float(np.max(probabilities))  # Get the confidence score
            
            # Create a dictionary with all genre probabilities (like a detailed report)
            all_probabilities = {
                self.label_encoder.inverse_transform([i])[0]: float(prob) 
                for i, prob in enumerate(probabilities)
            }
            
            return {
                "predicted_genre": genre,  # The most likely genre
                "confidence": confidence,  # How confident the model is (0-1)
                "all_probabilities": all_probabilities  # All genre probabilities
            }
            
        except Exception as e:  # If something goes wrong
            return {"error": str(e)}  # Return the error message
    
    def analyze_audio_emotion(self, y: np.ndarray, sr: int) -> Dict:
        """
        Analyze emotional content of audio
        
        This is like reading someone's mood from their voice
        We use simple rules based on audio characteristics to guess emotions
        Like: "Fast music = energetic, Slow music = calm"
        """
        
        # ===== EXTRACT AUDIO FEATURES =====
        features = self.extract_advanced_features(y, sr)  # Get all our audio features
        
        # ===== INITIALIZE EMOTION SCORES =====
        # Start with 0 points for each emotion (like a scoreboard)
        emotion_scores = {
            'happy': 0,      # Joyful, upbeat feelings
            'sad': 0,        # Melancholy, down feelings  
            'energetic': 0,  # High energy, exciting
            'calm': 0,       # Peaceful, relaxed
            'angry': 0       # Aggressive, intense
        }
        
        # ===== TEMPO-BASED ANALYSIS =====
        # Fast music usually sounds energetic, slow music sounds calm
        # Like how a fast heartbeat suggests excitement, slow suggests relaxation
        
        tempo = features['tempo']  # Beats per minute
        if tempo > 140:  # Very fast tempo (like dance music)
            emotion_scores['energetic'] += 0.3  # Add points for energetic
            emotion_scores['happy'] += 0.2      # Add points for happy
        elif tempo < 80:  # Very slow tempo (like ballads)
            emotion_scores['calm'] += 0.3       # Add points for calm
            emotion_scores['sad'] += 0.2        # Add points for sad
        
        # ===== SPECTRAL CENTROID ANALYSIS =====
        # Bright sounds (high frequencies) often sound happy
        # Dark sounds (low frequencies) often sound sad
        # Like how bright colors feel cheerful, dark colors feel somber
        
        spectral_centroid = features['spectral_centroid_mean']  # Average brightness
        if spectral_centroid > 2000:  # Bright sound
            emotion_scores['happy'] += 0.2      # Add points for happy
            emotion_scores['energetic'] += 0.2  # Add points for energetic
        else:  # Dark sound
            emotion_scores['sad'] += 0.2        # Add points for sad
            emotion_scores['calm'] += 0.2       # Add points for calm
        
        # ===== ENERGY ANALYSIS =====
        # Loud music often sounds energetic or angry
        # Quiet music often sounds calm
        # Like how shouting sounds angry, whispering sounds calm
        
        rms = features['rms_mean']  # Average energy level
        if rms > 0.1:  # High energy (loud)
            emotion_scores['energetic'] += 0.2  # Add points for energetic
            emotion_scores['angry'] += 0.1      # Add points for angry
        else:  # Low energy (quiet)
            emotion_scores['calm'] += 0.2       # Add points for calm
        
        # ===== NORMALIZE SCORES =====
        # Convert scores to percentages (like converting points to grades)
        # So all emotions add up to 100%
        
        total = sum(emotion_scores.values())  # Sum of all points
        if total > 0:  # If we have any points
            emotion_scores = {k: v/total for k, v in emotion_scores.items()}
            # Divide each score by total to get percentages
        
        # ===== FIND PREDICTED EMOTION =====
        # The emotion with the highest score wins!
        predicted_emotion = max(emotion_scores, key=emotion_scores.get)
        # max() finds the key with the highest value
        
        return {
            "predicted_emotion": predicted_emotion,  # The winning emotion
            "emotion_scores": emotion_scores,        # All emotion percentages
            "confidence": emotion_scores[predicted_emotion]  # Confidence in the prediction
        }
    
    def create_audio_embeddings(self, audio_files: List[str]) -> np.ndarray:
        """
        Create audio embeddings for similarity matching
        
        This is like creating a "fingerprint" for each audio file
        We can then compare these fingerprints to find similar songs
        Like how you can compare two photos to see if they're of the same person
        """
        
        embeddings = []  # List to store all the "fingerprints"
        
        # ===== PROCESS EACH AUDIO FILE =====
        for file_path in audio_files:
            try:  # Try to process this file
                # Load the audio file
                y, sr = librosa.load(file_path, duration=30)  # Load first 30 seconds
                
                # Extract all the audio features (our "fingerprint")
                features = self.extract_advanced_features(y, sr)
                
                # Convert features to a list and add to our collection
                embeddings.append(list(features.values()))
                # This creates a numerical "signature" for this audio file
                
            except Exception as e:  # If something goes wrong
                print(f"Error processing {file_path}: {e}")
                continue  # Skip this file and move to the next one
        
        # ===== CONVERT TO NUMPY ARRAY =====
        # Convert our list of fingerprints to a numpy array for faster processing
        return np.array(embeddings)  # Each row is one audio file's fingerprint
    
    def find_similar_audio(self, query_audio: str, reference_embeddings: np.ndarray, 
                          reference_files: List[str], top_k: int = 5) -> List[Dict]:
        """
        Find similar audio files using cosine similarity
        
        This is like finding the most similar photos in a photo album
        We compare the "fingerprint" of one song to all other songs
        and find the ones that are most similar!
        """
        
        try:  # Try to find similar audio
            # ===== CREATE QUERY FINGERPRINT =====
            # Get the fingerprint of the song we're looking for similar songs to
            
            y, sr = librosa.load(query_audio, duration=30)  # Load the query song
            query_features = self.extract_advanced_features(y, sr)  # Extract its features
            query_embedding = np.array(list(query_features.values())).reshape(1, -1)
            # Reshape to make it a single row (like [1, 2, 3] instead of [[1, 2, 3]])
            
            # ===== NORMALIZE EMBEDDINGS =====
            # This is like making sure all measurements are in the same units
            # So we can compare them fairly (like comparing apples to apples)
            
            query_norm = query_embedding / np.linalg.norm(query_embedding)
            # Normalize the query song's fingerprint
            
            ref_norm = reference_embeddings / np.linalg.norm(reference_embeddings, axis=1, keepdims=True)
            # Normalize all the reference songs' fingerprints
            
            # ===== CALCULATE COSINE SIMILARITIES =====
            # Cosine similarity measures how "aligned" two vectors are
            # Like measuring how similar two arrows are in direction
            # 1.0 = identical, 0.0 = completely different, -1.0 = opposite
            
            similarities = np.dot(ref_norm, query_norm.T).flatten()
            # np.dot() calculates the dot product (like multiplying and summing)
            # This gives us similarity scores for each reference song
            
            # ===== FIND TOP-K MOST SIMILAR =====
            # Sort the similarities and get the top K most similar songs
            
            top_indices = np.argsort(similarities)[::-1][:top_k]
            # np.argsort() gives us the indices in order of similarity
            # [::-1] reverses it so highest similarity comes first
            # [:top_k] takes only the top K results
            
            # ===== CREATE RESULTS LIST =====
            # Format the results in a nice way for the user
            
            results = []
            for idx in top_indices:  # For each of the top similar songs
                results.append({
                    "file": reference_files[idx],  # The filename
                    "similarity": float(similarities[idx]),  # How similar (0-1)
                    "rank": len(results) + 1  # Ranking (1st, 2nd, 3rd, etc.)
                })
            
            return results  # Return the list of similar songs
            
        except Exception as e:  # If something goes wrong
            return [{"error": str(e)}]  # Return an error message
    
    def create_audio_visualization_data(self, y: np.ndarray, sr: int) -> Dict:
        """
        Create comprehensive audio visualization data for React frontend
        
        Instead of creating plots in Python, we return clean data that React can consume
        This is like creating a data API that your frontend can use with Chart.js, D3.js, etc.
        """
        
        print("📊 Creating audio visualization data for React frontend...")
        
        # ===== WAVEFORM DATA =====
        # Raw audio signal over time - perfect for line charts
        time = np.linspace(0, len(y)/sr, len(y))  # Time axis in seconds
        waveform_data = {
            "x": time.tolist(),  # Convert numpy array to list for JSON
            "y": y.tolist(),     # Audio samples
            "type": "line",
            "title": "Waveform",
            "x_label": "Time (seconds)",
            "y_label": "Amplitude"
        }
        
        # ===== SPECTROGRAM DATA =====
        # Frequency content over time - perfect for heat maps
        stft = librosa.stft(y)  # Short-Time Fourier Transform
        magnitude = np.abs(stft)  # Get magnitude of each frequency
        
        # Downsample for performance (take every 10th point)
        magnitude_downsampled = magnitude[::10, ::10]
        
        spectrogram_data = {
            "z": magnitude_downsampled.tolist(),  # 2D array for heat map
            "type": "heatmap",
            "title": "Spectrogram",
            "x_label": "Time",
            "y_label": "Frequency",
            "colorscale": "Viridis"
        }
        
        # ===== MFCC DATA =====
        # 13 MFCC coefficients over time - like audio "DNA"
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        
        mfcc_data = {
            "z": mfccs.tolist(),  # 2D array: 13 coefficients × time frames
            "type": "heatmap",
            "title": "MFCC Features",
            "x_label": "Time",
            "y_label": "MFCC Coefficient",
            "colorscale": "RdBu"
        }
        
        # ===== CHROMA DATA =====
        # Musical notes over time - like a piano roll
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        chroma_data = {
            "z": chroma.tolist(),  # 2D array: 12 notes × time frames
            "y_labels": note_names,  # Note names for y-axis
            "type": "heatmap",
            "title": "Chroma Features (Musical Notes)",
            "x_label": "Time",
            "y_label": "Musical Note",
            "colorscale": "Blues"
        }
        
        # ===== SPECTRAL FEATURES TIME SERIES =====
        # How brightness changes over time
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        time_frames = np.linspace(0, len(y)/sr, len(spectral_centroids))
        
        spectral_data = {
            "x": time_frames.tolist(),
            "y": spectral_centroids.tolist(),
            "type": "line",
            "title": "Spectral Centroid (Brightness)",
            "x_label": "Time (seconds)",
            "y_label": "Frequency (Hz)"
        }
        
        # ===== TEMPO AND BEATS DATA =====
        # Beat detection and tempo
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        beat_times = librosa.frames_to_time(beats, sr=sr)
        
        tempo_data = {
            "x": beat_times.tolist(),
            "y": [tempo] * len(beat_times),  # Constant tempo line
            "type": "scatter",
            "title": f"Beat Detection (Tempo: {tempo:.1f} BPM)",
            "x_label": "Time (seconds)",
            "y_label": "Tempo (BPM)",
            "tempo": float(tempo),
            "beat_count": len(beats)
        }
        
        # ===== SUMMARY STATISTICS =====
        # Key numbers for your React dashboard
        summary_stats = {
            "duration": float(len(y) / sr),
            "sample_rate": int(sr),
            "tempo": float(tempo),
            "beat_count": len(beats),
            "spectral_centroid_mean": float(np.mean(spectral_centroids)),
            "spectral_centroid_std": float(np.std(spectral_centroids)),
            "max_amplitude": float(np.max(np.abs(y))),
            "rms_energy": float(np.sqrt(np.mean(y**2)))
        }
        
        # ===== RETURN ALL DATA FOR REACT =====
        visualization_data = {
            "waveform": waveform_data,
            "spectrogram": spectrogram_data,
            "mfcc": mfcc_data,
            "chroma": chroma_data,
            "spectral": spectral_data,
            "tempo": tempo_data,
            "summary": summary_stats,
            "metadata": {
                "total_samples": len(y),
                "duration_seconds": len(y) / sr,
                "data_points": {
                    "waveform": len(y),
                    "spectrogram": magnitude_downsampled.size,
                    "mfcc": mfccs.size,
                    "chroma": chroma.size
                }
            }
        }
        
        print(f"✅ Created visualization data with {len(visualization_data)} panels")
        print(f"📈 Data points: Waveform={len(y)}, Spectrogram={magnitude_downsampled.size}")
        
        return visualization_data
    
    def generate_audio_report(self, audio_file: str) -> Dict:
        """Generate comprehensive audio analysis report"""
        try:
            y, sr = librosa.load(audio_file, duration=30)
            
            # Extract features
            features = self.extract_advanced_features(y, sr)
            
            # Analyze emotion
            emotion_analysis = self.analyze_audio_emotion(y, sr)
            
            # Predict genre if model is available
            genre_prediction = self.predict_genre(audio_file)
            
            # Create visualization data for React frontend
            viz_data = self.create_audio_visualization_data(y, sr)
            
            return {
                "file_info": {
                    "filename": os.path.basename(audio_file),
                    "duration": features['duration'],
                    "sample_rate": features['sample_rate']
                },
                "features": features,
                "emotion_analysis": emotion_analysis,
                "genre_prediction": genre_prediction,
                "visualization": viz_data,
                "summary": {
                    "key_insights": [
                        f"Tempo: {features['tempo']:.1f} BPM",
                        f"Predicted Emotion: {emotion_analysis['predicted_emotion']}",
                        f"Energy Level: {'High' if features['rms_mean'] > 0.1 else 'Low'}",
                        f"Spectral Centroid: {features['spectral_centroid_mean']:.1f} Hz"
                    ]
                }
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def save_models(self, model_dir: str = "models"):
        """Save trained models"""
        os.makedirs(model_dir, exist_ok=True)
        
        if self.genre_model is not None:
            if hasattr(self.genre_model, 'save'):
                self.genre_model.save(f"{model_dir}/genre_model.h5")
            else:
                joblib.dump(self.genre_model, f"{model_dir}/genre_model.pkl")
        
        joblib.dump(self.scaler, f"{model_dir}/scaler.pkl")
        joblib.dump(self.label_encoder, f"{model_dir}/label_encoder.pkl")
        
        with open(f"{model_dir}/feature_names.json", 'w') as f:
            json.dump(self.feature_names, f)
    
    def load_models(self, model_dir: str = "models"):
        """Load trained models"""
        try:
            if os.path.exists(f"{model_dir}/genre_model.h5"):
                self.genre_model = keras.models.load_model(f"{model_dir}/genre_model.h5")
            elif os.path.exists(f"{model_dir}/genre_model.pkl"):
                self.genre_model = joblib.load(f"{model_dir}/genre_model.pkl")
            
            self.scaler = joblib.load(f"{model_dir}/scaler.pkl")
            self.label_encoder = joblib.load(f"{model_dir}/label_encoder.pkl")
            
            with open(f"{model_dir}/feature_names.json", 'r') as f:
                self.feature_names = json.load(f)
            
            return True
        except Exception as e:
            print(f"Error loading models: {e}")
            return False

# Initialize the analyzer
audio_ml = AudioMLAnalyzer()
