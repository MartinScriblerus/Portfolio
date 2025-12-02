# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## FastAPI backend (optional)

This repo includes a `fastapi/` folder with a FastAPI app that provides endpoints used by the legacy file tools:

- POST `/analyze_audio` (multipart file upload)
- POST `/transpose_sample` (JSON)

How to run locally (in a separate terminal):

1. Create and activate a Python virtual environment, then install requirements:
	 - macOS/Linux (zsh):
		 - python3 -m venv .venv
		 - source .venv/bin/activate
		 - pip install -r fastapi/requirements.txt
2. Start the server:
	 - uvicorn fastapi.main:app --reload --port 8000

Notes:
- CORS is already enabled for http://localhost:3000.
- The frontend calls to these endpoints are currently disabled and safely no-op to avoid failures if the backend is not running.
	- See `src/components/OldParentMonolith/OldFileWindow.tsx` (functions `uploadAudioFile` and `transposeAudio`). Remove the early returns to re-enable.
- The server defines `/analyze_audio` without a trailing slash; prefer that exact path in the client.

Housekeeping:
- The `fastapi/` folder contains some local dev artifacts (e.g., virtualenvs) and demo/test scripts. Only `main.py`, `requirements.txt`, and modules directly imported by `main.py` are required at runtime. You can safely exclude `.venv/`, `venv/`, and test/demo files from version control.
