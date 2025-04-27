import serial
import os
import time
import pyautogui
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
from flask import Flask, request, jsonify
from flask_cors import CORS
from ctypes import cast, POINTER
from comtypes import CLSCTX_ALL
import pythoncom
import webbrowser
import subprocess

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Global variable to keep track of the browser window
driver = None

# Function to find Chrome path
def get_chrome_path():
    common_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expanduser("~") + r"\AppData\Local\Google\Chrome\Application\chrome.exe",
    ]
    
    for path in common_paths:
        if os.path.exists(path):
            return path
            
    return None

# Register Chrome browser
chrome_path = get_chrome_path()
if chrome_path:
    webbrowser.register('chrome', None, webbrowser.BackgroundBrowser(chrome_path))

# Function to get current volume level
def get_volume_level():
    try:
        # Initialize COM for this thread
        pythoncom.CoInitialize()
        
        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(
            IAudioEndpointVolume._iid_,
            CLSCTX_ALL,
            None
        )
        volume = cast(interface, POINTER(IAudioEndpointVolume))
        current_volume = volume.GetMasterVolumeLevelScalar()
        return int(current_volume * 100)
    except Exception as e:
        print(f"❌ Volume control error: {e}")
        return 0
    finally:
        # Uninitialize COM
        pythoncom.CoUninitialize()

# Function to open URL in Chrome
def open_url_in_chrome(url):
    try:
        if chrome_path:
            subprocess.Popen([chrome_path, '--new-tab', url])
            return True
        else:
            print("❌ Chrome not found")
            return False
    except Exception as e:
        print(f"❌ Browser error: {e}")
        return False

# Function to open Chrome and search
def chrome_search(query):
    search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
    return open_url_in_chrome(search_url)

# Function to open WhatsApp Web
def open_whatsapp():
    return open_url_in_chrome('https://web.whatsapp.com')

# Function to open Gmail
def open_gmail():
    return open_url_in_chrome('https://mail.google.com')

# Function to open ChatGPT
def open_chatgpt():
    return open_url_in_chrome('https://chat.openai.com')

# Function to open YouTube, search for a video, and display results
def search_and_display_youtube_results(song_name):
    global driver
    print(f"Searching for '{song_name}' on YouTube...")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    
    search_url = f"https://www.youtube.com/results?search_query={song_name.replace(' ', '+')}"
    driver.get(search_url)
    
    print(f"✅ YouTube opened and searched for '{song_name}'.")
    
    time.sleep(3)
    
    try:
        video_elements = driver.find_elements(By.XPATH, '//*[@id="video-title"]')
        video_links = [video.get_attribute("href") for video in video_elements[:5]]
        video_titles = [video.get_attribute("title") for video in video_elements[:5]]

        if not video_links:
            print("❌ No videos found.")
            driver.quit()
            return None
        
        return {
            'links': video_links,
            'titles': video_titles
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

# Function to play the selected video by voice command
def play_video_by_number(number):
    global driver
    try:
        video_elements = driver.find_elements(By.XPATH, '//*[@id="video-title"]')
        video_links = [video.get_attribute("href") for video in video_elements[:5]]
        
        if 1 <= number <= len(video_links):
            selected_video = video_links[number - 1]
            print(f"✅ Playing video: {selected_video}")
            driver.get(selected_video)
            time.sleep(5)
            pyautogui.press('space')
            return True
        else:
            print("❌ Invalid video selection.")
            return False
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

# Function to close YouTube
def close_youtube():
    global driver
    if driver:
        print("❌ Closing YouTube...")
        driver.quit()
        driver = None
        return True
    return False

# Function to adjust volume
def adjust_volume(command):
    try:
        # Initialize COM for this thread
        pythoncom.CoInitialize()
        
        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(
            IAudioEndpointVolume._iid_,
            CLSCTX_ALL,
            None
        )
        volume = cast(interface, POINTER(IAudioEndpointVolume))
        current_volume = volume.GetMasterVolumeLevelScalar()
        
        if command == "volume up":
            new_volume = min(current_volume + 0.1, 1.0)  # Increase by 10%
            volume.SetMasterVolumeLevelScalar(new_volume, None)
            print(f"Volume increased to {new_volume * 100}%")
            return True
        
        elif command == "volume down":
            new_volume = max(current_volume - 0.1, 0.0)  # Decrease by 10%
            volume.SetMasterVolumeLevelScalar(new_volume, None)
            print(f"Volume decreased to {new_volume * 100}%")
            return True
        
        return False
    except Exception as e:
        print(f"❌ Volume control error: {e}")
        return False
    finally:
        # Uninitialize COM
        pythoncom.CoUninitialize()

# Function to shutdown the system
def shutdown_system():
    print("⚡ Shutting down the system...")
    os.system("shutdown /s /f /t 0")
    return True

# App commands mapping
app_commands = {
    "chrome": {
        "open": "start chrome",
        "close": "taskkill /im chrome.exe /f"
    },
    "notepad": {
        "open": "start notepad",
        "close": "taskkill /im notepad.exe /f"
    },
    "vscode": {
        "open": "code",
        "close": "taskkill /im Code.exe /f"
    },
    "calculator": {
        "open": "start calc",
        "close": "taskkill /im Calculator.exe /f"
    },
    "word": {
        "open": "start winword",
        "close": "taskkill /im WINWORD.EXE /f"
    }
}

@app.route('/api/command', methods=['POST'])
def handle_command():
    data = request.json
    command = data.get('command', '').lower()
    parts = command.split()

    try:
        # Handle get volume command
        if command == "get volume":
            volume = get_volume_level()
            return jsonify({'success': True, 'volume': volume})

        # Handle Chrome search command
        if len(parts) > 2 and parts[0] == "chrome" and parts[1] == "search":
            query = ' '.join(parts[2:])
            success = chrome_search(query)
            return jsonify({'success': success})

        # Handle WhatsApp Web
        if command == "open whatsapp":
            success = open_whatsapp()
            return jsonify({'success': success})

        # Handle Gmail
        if command == "open gmail":
            success = open_gmail()
            return jsonify({'success': success})

        # Handle ChatGPT
        if command == "open chatgpt":
            success = open_chatgpt()
            return jsonify({'success': success})

        # Handle YouTube search and play command
        if len(parts) > 2 and parts[0] == "youtube" and parts[1] == "search" and parts[2] == "play":
            song_name = ' '.join(parts[3:])
            results = search_and_display_youtube_results(song_name)
            return jsonify({'success': True, 'results': results})
        
        # Handle video selection by number
        elif len(parts) == 3 and parts[0] == "play" and parts[1] == "video":
            video_number = int(parts[2])
            success = play_video_by_number(video_number)
            return jsonify({'success': success})

        # Handle closing YouTube
        elif len(parts) == 2 and parts[0] == "close" and parts[1] == "youtube":
            success = close_youtube()
            return jsonify({'success': success})

        # Handle volume control commands
        elif len(parts) == 2 and parts[0] == "volume":
            success = adjust_volume(command)
            volume = get_volume_level()
            return jsonify({'success': success, 'volume': volume})
            
        # Handle system shutdown
        elif parts[0] == "shutdown":
            success = shutdown_system()
            return jsonify({'success': success})

        # Handle other commands like open/close apps
        elif len(parts) == 2:
            action, app = parts
            if app in app_commands and action in app_commands[app]:
                os.system(app_commands[app][action])
                return jsonify({'success': True})

        return jsonify({'success': False, 'error': 'Unknown command'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(port=5001)