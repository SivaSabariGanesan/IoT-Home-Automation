    import serial
    import os
    import time
    import pyautogui
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from webdriver_manager.chrome import ChromeDriverManager
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume  # Importing necessary modules

    # Global variable to keep track of the browser window
    driver = None

    # Function to open YouTube, search for a video, and display results
    def search_and_display_youtube_results(song_name):
        global driver
        print(f"Searching for '{song_name}' on YouTube...")
        
        # Set up Chrome driver using webdriver_manager
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service)
        
        # Go to YouTube search page for the song
        search_url = f"https://www.youtube.com/results?search_query={song_name.replace(' ', '+')}"
        driver.get(search_url)
        
        print(f"✅ YouTube opened and searched for '{song_name}'.")
        
        # Wait for the page to load
        time.sleep(3)
        
        # Get the first 5 video results
        try:
            video_elements = driver.find_elements(By.XPATH, '//*[@id="video-title"]')  # XPath for video title links
            video_links = [video.get_attribute("href") for video in video_elements[:5]]  # Get the URLs of the first 5 videos
            video_titles = [video.get_attribute("title") for video in video_elements[:5]]  # Get the titles for display

            if not video_links:
                print("❌ No videos found.")
                driver.quit()
                return
            
            # Display results to the user (show the titles in the browser window)
            print("Here are the top 5 results:")
            for i, title in enumerate(video_titles, 1):
                print(f"{i}. {title}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
        
    # Function to play the selected video by voice command
    def play_video_by_number(number):
        global driver
        try:
            video_elements = driver.find_elements(By.XPATH, '//*[@id="video-title"]')
            video_links = [video.get_attribute("href") for video in video_elements[:5]]
            
            if 1 <= number <= len(video_links):
                selected_video = video_links[number - 1]
                print(f"✅ Playing video: {selected_video}")
                driver.get(selected_video)  # Open the selected video
                time.sleep(5)  # Wait for the video to load
                pyautogui.press('space')  # Play/pause the video
                print("✅ Video playing/paused.")
            else:
                print("❌ Invalid video selection.")
        
        except Exception as e:
            print(f"❌ Error: {e}")

    # Function to close YouTube
    def close_youtube():
        global driver
        if driver:
            print("❌ Closing YouTube...")
            driver.quit()
            print("✅ YouTube closed.")

    # Function to adjust volume (up or down)
    def adjust_volume(command):
        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(
            IAudioEndpointVolume._iid_,  # Required Interface ID
            1,  # The flag for volume control
            None
        )
        
        volume = interface.QueryInterface(IAudioEndpointVolume)  # Querying the volume interface
        
        current_volume = volume.GetMasterVolumeLevelScalar()
        print(f"Current volume: {current_volume:.2f}")
        
        if command == "volume up":
            new_volume = min(current_volume + 0.05, 1)  # Increase volume by 5%
            volume.SetMasterVolumeLevelScalar(new_volume, None)  # Set the volume
            print(f"✅ Volume increased to {new_volume:.2f}.")
        
        elif command == "volume down":
            new_volume = max(current_volume - 0.05, 0)  # Decrease volume by 5%
            volume.SetMasterVolumeLevelScalar(new_volume, None)  # Set the volume
            print(f"✅ Volume decreased to {new_volume:.2f}.")
        
        else:
            print("❌ Invalid volume command.")

    # Function to shutdown the system
    def shutdown_system():
        print("⚡ Shutting down the system...")
        os.system("shutdown /s /f /t 0")  # Initiates system shutdown

    # Set up your app commands
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
        },
        "youtube": {
            "search_and_play": search_and_display_youtube_results,  # This will handle the search command for YouTube
            "close": close_youtube  # This will handle the close command for YouTube
        },
        "volume": {
            "up": lambda: adjust_volume("volume up"),  # Function to increase volume
            "down": lambda: adjust_volume("volume down")  # Function to decrease volume
        },
        "shutdown": shutdown_system  # Function to shutdown the system
    }

    # Mapping words like 'first', 'second', 'third', etc., to numbers
    def map_command_to_video_number(command):
        mapping = {
            "first": 1,
            "second": 2,
            "third": 3,
            "fourth": 4,
            "fifth": 5
        }
        return mapping.get(command, -1)  # Return -1 if not a valid command

    # Make sure this is your actual COM port:
    ser = serial.Serial('COM7', 9600, timeout=1)
    print("🔊 Listening for voice commands...")

    while True:
        if ser.in_waiting:
            try:
                raw = ser.readline()
                command = raw.decode('utf-8', errors='ignore').strip().lower()
                print(f"🎤 Received: {command}")

                parts = command.split()

                # Handle YouTube search and play command
                if len(parts) > 2 and parts[0] == "youtube" and parts[1] == "search" and parts[2] == "play":
                    song_name = ' '.join(parts[3:])  # Get the song name if provided
                    if song_name:
                        app_commands["youtube"]["search_and_play"](song_name)  # Play the song on YouTube
                    else:
                        print("❌ Error: No song name provided.")
                
                # Handle video selection by number
                elif len(parts) == 3 and parts[0] == "play" and parts[1] == "video":
                    video_number = map_command_to_video_number(parts[2])  # Map command to video number
                    if video_number != -1:
                        play_video_by_number(video_number)  # Play the selected video
                    else:
                        print("❌ Error: Invalid selection command (e.g., 'first', 'second', 'third').")

                # Handle closing YouTube
                elif len(parts) == 2 and parts[0] == "close" and parts[1] == "youtube":
                    app_commands["youtube"]["close"]()  # Close YouTube

                # Handle volume control commands
                elif len(parts) == 2 and parts[0] == "volume":
                    action = parts[1]
                    if action in app_commands["volume"]:
                        app_commands["volume"][action]()  # Adjust volume
                    else:
                        print("❌ Error: Invalid volume command (volume up or volume down).")
                    
                # Handle system shutdown
                elif parts[0] == "shutdown":
                    app_commands["shutdown"]()  # Shutdown the system
                    break  # Break the loop after shutdown command

                # Handle other commands like open/close apps
                elif len(parts) == 2:
                    action, app = parts
                    if app in app_commands and action in app_commands[app]:
                        os.system(app_commands[app][action])
                        print(f"🛠 {action}ing {app}")
                    else:
                        print(f"⚠️ Unknown command: {command}")
                else:
                    print("❓ Unknown command format.")

            except Exception as e:
                print(f"❌ Error: {e}")
