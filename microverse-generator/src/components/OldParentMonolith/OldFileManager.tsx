import React, { useRef } from 'react';
import { Box, Button } from '@mui/material';

type OldFileManagerProps = {
	onSubmit: (files: { file: FileList }) => void;
	FileUploadIcon?: React.ElementType;
	chuckHook?: any;
    onBpmDetected?: (bpm: number | null) => void;
};

const OldFileManager: React.FC<OldFileManagerProps> = ({ onSubmit, FileUploadIcon, chuckHook }) => {
	const inputRef = useRef<HTMLInputElement | null>(null);

	const handleButtonClick = () => {
		inputRef.current?.click();
	};

	const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		if (e.target.files && e.target.files.length > 0) {
			onSubmit({ file: e.target.files });
			
			// reset so selecting same file again still triggers change
			e.currentTarget.value = '';
		}
	};

	return (
		<Box sx={{ display: 'flex', cursor: "pointer", pointerEvents: "auto", alignItems: 'center', gap: 1 }}>
			<input
				ref={inputRef}
				type="file"
				accept="audio/*"
				onChange={handleFileChange}
				style={{ display: 'none' }}
			/>
			<Button
				variant="contained"
				onClick={handleButtonClick}
				disabled={!chuckHook}
				startIcon={FileUploadIcon ? <FileUploadIcon /> : undefined}
				sx={{ fontFamily: 'monospace' }}
			>
				Upload Audio
			</Button>
		</Box>
	);
};

export default OldFileManager;
