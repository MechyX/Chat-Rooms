const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('#submit')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room }  = Qs.parse(location.search,{ ignoreQueryPrefix : true})

socket.on('roomData',({room, users}) => {
   const html = Mustache.render(sidebarTemplate, {
       room,
       users
   })
    document.querySelector('#sidebar').innerHTML = html
})

const autoScroll = () => {
    // New Message Element
    const $newMessage = $messages.lastElementChild

    // Get height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('recieveLocationMessage',(LocationMessage) => {
    const html = Mustache.render(locationMessageTemplate,{
        username : LocationMessage.username,
        url : LocationMessage.url,
        createdAt: moment(LocationMessage.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})


socket.on('recieveMessage', (message) => {
    const html = Mustache.render(messageTemplate, {
        username : message.username,
        message :  message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute('disabled','disabled')

    let message = e.target.elements.message.value

    socket.emit('sendMessage',message, (error)=> {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value= ''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
          console.log('The message was delivered') //notify to the one who sent it
    })
})

$sendLocationButton.addEventListener('click', () => {
    
    if(!navigator.geolocation){
        return alert('Geolocation not supported by your browser')
    }

    $sendLocationButton.setAttribute('disabled','disabled') 

    navigator.geolocation.getCurrentPosition((position) => {
        
        const location = {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        }
        
        socket.emit('sendLocation',location, (message) => {
           $sendLocationButton.removeAttribute('disabled')
            console.log(message)
        })
    })
})

socket.emit('join',{ username, room } , (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})