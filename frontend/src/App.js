import './App.css';
import React, { useState, useEffect } from 'react';
import { Modal, TextField, Button, Box } from '@material-ui/core';


function App() {

  const bot = '/bot.svg'
  const user = '/user.svg'

  const [apiKey, setApiKey] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('apiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      // Call the loadChatHistory function to load the chat history when the component mounts
      loadChatHistory();
    } else {
      // show the modal
      setIsModalOpen(true);
    }
  },[]);

  const loadChatHistory = async () => {
    try {
    const response = await fetch(process.env.REACT_APP_BACKEND_URL+'/api/chat',{
                            method: 'GET',
                            headers: {
                              'Content-Type': 'application/json'
                              }
                            });
    const messages = await response.json();

      // Loop through the messages array and generate chat messages
    let isAi = false; // start with user message
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const uniqueId = generateUniqueId();
      const chatMessage = chatStripe(isAi, message, uniqueId);
      const chatContainer = document.querySelector('#chat_container')
      chatContainer.innerHTML += chatMessage;
      isAi = !isAi; // switch to bot message for the next iteration
    }
  }catch (error) {
    console.error("Error loading chat history:", error);
  }

};

  const handleApiKeyChange = (event) => {
    setApiKey(event.target.value);
  };

  const handleApiKeySubmit = (event) => {
    event.preventDefault();
    localStorage.setItem('apiKey', apiKey);
    // hide the modal
    setIsModalOpen(false);
  };

  //const chatContainerRef = React.createRef();
  const chatContainer = document.querySelector('#chat_container')

  const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
  }

  const chatStripe = (isAi, value, uniqueId) => {
    return (
      `
      <div class="wrapper ${isAi && 'ai'}">
        <div class="chat">
          <div class="profile">
            <img 
              src=${isAi ? bot : user} 
              alt="${isAi ? 'bot' : 'user'}" 
            />
          </div>
          <div class="message" id=${uniqueId}>${value}</div>
        </div>
      </div>
    `
    );
  }

  const loader = (element) => {
    element.textContent = '';

    const loadInterval = setInterval(() => {
      // Update the text content of the loading indicator
      element.textContent += '.';

      // If the loading indicator has reached three dots, reset it
      if (element.textContent === '....') {
        element.textContent = '';
      }
    }, 300);

    return loadInterval;
  }

  const typeText = (element, text) => {
    let index = 0

    let interval = setInterval(() => {
      if (index < text.length) {
        element.innerHTML += text.charAt(index)
        index++
      } else {
        clearInterval(interval)
      }
    }, 20)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const data = new FormData(e.target)

    // user's chatstripe
    chatContainer.innerHTML += chatStripe(false, data.get('prompt'))

    // to clear the textarea input 
    e.target.reset()

    // bot's chatstripe
    const uniqueId = generateUniqueId();
    chatContainer.innerHTML += chatStripe(true, " ", uniqueId)

    // to focus scroll to the bottom 
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // specific message div 
    const messageDiv = document.getElementById(uniqueId)

    const loadInterval = loader(messageDiv)

    const response = await fetch(process.env.REACT_APP_BACKEND_URL+'/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: data.get('prompt'),
        apiKey: apiKey
      })
    })

    clearInterval(loadInterval)
    messageDiv.innerHTML = " "

    if (response.ok) {
      const data = await response.json();
      const parsedData = data.bot.trim() // trims any trailing spaces/'\n'
      //console.warn(data.chatHistory.trim())

      typeText(messageDiv, parsedData)
    } else {
        const err = await response.text()

        messageDiv.innerHTML = "Something went wrong"
        alert(err)
    }
  }

  return (<>
    <div className="App">
      <div id="chat_container"></div>
      <form className='prompt-form' onSubmit={handleSubmit}>
        <Button onClick={() => setIsModalOpen(true)}><img src="/settings.svg" alt="api config" /></Button>
        <textarea name="prompt" rows="1" cols="1" placeholder="Ask me..."></textarea>
        <button type="submit"><img src="/send.svg" alt="send" /></button>
      </form>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}
                  display="flex"
                  alignitems="center"
                  justifycontent="center"
                  height = "100%"
      >
        <Box
            display="flex"
            alignitems="center"
            justifycontent="center"
            bgcolor="rgba(255, 255, 255, 0.95)"
            borderRadius={5}
            p={2}
            padding="50px"
            width="61%"
            margin=" 40vh auto"
        >
          <form onSubmit={handleApiKeySubmit} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <TextField label="API key" value={apiKey} onChange={handleApiKeyChange} variant="outlined" style={{ width: '40rem' }}/>
            <Box display="flex" justifyContent="center" marginLeft='20px'>
              <Button variant="contained" color="primary" type="submit">Save</Button>
            </Box>
          </form>
        </Box>
      </Modal>
      </div>
      </>
  );
}

export default App;
