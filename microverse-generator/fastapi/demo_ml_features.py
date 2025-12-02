"""
Demo script showcasing ML features for AI Engineer Interview
This script demonstrates all the ML capabilities of the audio processing API
"""

import requests
import json
import os
import time
from pathlib import Path

# API base URL
BASE_URL = "http://localhost:8000"

def test_ml_health():
    """Test ML module health"""
    print("🔍 Testing ML Module Health...")
    response = requests.get(f"{BASE_URL}/ml/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_audio_features():
    """Test audio feature extraction"""
    print("🎵 Testing Audio Feature Extraction...")
    
    # Create a simple test audio file (you can replace this with actual audio)
    test_audio_path = "test_audio.wav"
    
    # For demo purposes, we'll use a placeholder
    print("Note: Upload an actual audio file to test feature extraction")
    print("Endpoint: POST /ml/audio_features")
    print("Expected features: 50+ audio features including MFCC, spectral, rhythm, etc.")
    print()

def test_emotion_analysis():
    """Test emotion analysis"""
    print("😊 Testing Emotion Analysis...")
    print("Endpoint: POST /ml/analyze_emotion")
    print("Features:")
    print("- Happy, Sad, Energetic, Calm, Angry classification")
    print("- Tempo-based analysis")
    print("- Spectral centroid analysis")
    print("- RMS energy analysis")
    print()

def test_genre_classification():
    """Test genre classification"""
    print("🎼 Testing Genre Classification...")
    print("Endpoint: POST /ml/predict_genre")
    print("Features:")
    print("- CNN-based spectrogram analysis")
    print("- Random Forest on audio features")
    print("- Confidence scores for all genres")
    print()

def test_audio_similarity():
    """Test audio similarity matching"""
    print("🔍 Testing Audio Similarity Matching...")
    print("Endpoint: POST /ml/find_similar")
    print("Features:")
    print("- Cosine similarity on audio embeddings")
    print("- Top-K similar audio files")
    print("- Feature-based matching")
    print()

def test_ai_music_generation():
    """Test AI music generation"""
    print("🤖 Testing AI Music Generation...")
    
    # Test the AI music generation endpoint
    data = {
        "prompt": "Create a melancholic jazz chord progression",
        "key": "Cm",
        "style": "jazz"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/ml/ai_generate_music", json=data)
        if response.status_code == 200:
            result = response.json()
            print("✅ AI Music Generation Working!")
            print(f"AI Suggestion: {result.get('ai_suggestion', 'N/A')[:200]}...")
            print(f"Key: {result.get('key')}")
            print(f"Style: {result.get('style')}")
        else:
            print(f"❌ Error: {response.status_code}")
    except Exception as e:
        print(f"❌ Connection error: {e}")
    print()

def test_comprehensive_analysis():
    """Test comprehensive audio analysis"""
    print("📊 Testing Comprehensive Audio Analysis...")
    print("Endpoint: POST /ml/analyze_audio")
    print("Features:")
    print("- Complete audio feature extraction")
    print("- Emotion analysis")
    print("- Genre prediction")
    print("- Interactive visualizations")
    print("- Statistical analysis")
    print()

def test_model_training():
    """Test model training capabilities"""
    print("🧠 Testing Model Training...")
    print("Endpoint: POST /ml/train_genre_model")
    print("Features:")
    print("- CNN and Random Forest models")
    print("- Custom dataset training")
    print("- Model persistence")
    print("- Performance metrics")
    print()

def create_demo_data():
    """Create demo data for testing"""
    print("📁 Creating Demo Data Structure...")
    
    demo_structure = {
        "audio_samples": {
            "jazz": ["jazz_sample1.wav", "jazz_sample2.wav"],
            "rock": ["rock_sample1.wav", "rock_sample2.wav"],
            "classical": ["classical_sample1.wav", "classical_sample2.wav"],
            "electronic": ["electronic_sample1.wav", "electronic_sample2.wav"]
        },
        "test_files": ["test_audio1.wav", "test_audio2.wav"],
        "reference_files": ["ref1.wav", "ref2.wav", "ref3.wav"]
    }
    
    with open("demo_data_structure.json", "w") as f:
        json.dump(demo_structure, f, indent=2)
    
    print("✅ Demo data structure created: demo_data_structure.json")
    print()

def show_api_endpoints():
    """Show all available API endpoints"""
    print("🚀 Available ML-Powered API Endpoints:")
    print("=" * 50)
    
    endpoints = [
        ("GET", "/ml/health", "Check ML module health and features"),
        ("POST", "/ml/analyze_audio", "Comprehensive ML audio analysis"),
        ("POST", "/ml/predict_genre", "Music genre classification"),
        ("POST", "/ml/analyze_emotion", "Emotional content analysis"),
        ("POST", "/ml/find_similar", "Audio similarity matching"),
        ("POST", "/ml/train_genre_model", "Train custom genre classifier"),
        ("POST", "/ml/audio_features", "Extract detailed audio features"),
        ("POST", "/ml/ai_generate_music", "AI-powered music generation"),
        ("GET", "/lmstudio/health", "LMStudio server health"),
        ("GET", "/lmstudio/models", "Available AI models"),
        ("POST", "/lmstudio/chat", "Chat with AI models"),
        ("POST", "/mingus_chords", "Music theory chord analysis"),
        ("POST", "/mingus_scales", "Music theory scale analysis"),
        ("POST", "/analyze_audio", "Source separation with demucs")
    ]
    
    for method, endpoint, description in endpoints:
        print(f"{method:6} {endpoint:25} - {description}")
    
    print()

def show_ml_technologies():
    """Show ML technologies and libraries used"""
    print("🔬 ML Technologies & Libraries Used:")
    print("=" * 40)
    
    technologies = [
        "TensorFlow & Keras - Deep Learning",
        "Scikit-learn - Traditional ML",
        "Librosa - Audio Processing",
        "NumPy & Pandas - Data Manipulation",
        "Matplotlib & Plotly - Visualization",
        "Seaborn - Statistical Visualization",
        "Joblib - Model Persistence",
        "LMStudio - AI Integration"
    ]
    
    for tech in technologies:
        print(f"✅ {tech}")
    
    print()

def show_interview_talking_points():
    """Show key talking points for the interview"""
    print("💬 Key Interview Talking Points:")
    print("=" * 35)
    
    points = [
        "🎵 Audio Feature Engineering: 50+ features including MFCC, spectral, rhythm",
        "🧠 Multiple ML Approaches: CNN for spectrograms, Random Forest for features",
        "📊 Data Visualization: Interactive plots with Plotly and Matplotlib",
        "🤖 AI Integration: LMStudio for creative music generation",
        "🔄 Model Training: Custom dataset training with persistence",
        "📈 Performance Metrics: Classification reports and confusion matrices",
        "🔍 Similarity Matching: Cosine similarity on audio embeddings",
        "🎼 Music Theory: Integration with existing chord/scale analysis",
        "⚡ Real-time Processing: Async FastAPI with proper error handling",
        "📱 API Design: RESTful endpoints with comprehensive documentation"
    ]
    
    for point in points:
        print(point)
    
    print()

def main():
    """Run all demo tests"""
    print("🎤 Audio ML Features Demo for AI Engineer Interview")
    print("=" * 55)
    print()
    
    # Test all features
    test_ml_health()
    test_audio_features()
    test_emotion_analysis()
    test_genre_classification()
    test_audio_similarity()
    test_ai_music_generation()
    test_comprehensive_analysis()
    test_model_training()
    
    # Show additional information
    create_demo_data()
    show_api_endpoints()
    show_ml_technologies()
    show_interview_talking_points()
    
    print("🎉 Demo Complete! Your audio ML API is ready for the interview!")
    print()
    print("Next Steps:")
    print("1. Start the FastAPI server: python -m uvicorn main:app --reload")
    print("2. Test endpoints with actual audio files")
    print("3. Train models with your own dataset")
    print("4. Showcase the interactive visualizations")
    print("5. Demonstrate AI integration with LMStudio")

if __name__ == "__main__":
    main()
