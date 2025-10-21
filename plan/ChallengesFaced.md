### In this document, I intend to document the challenges I faced while working on the project. 

### I have faced 2 main challenges, the second one is the most important. 

#### 1. Navigation challenge. 
when it was time to implement the navigation system for the slide presentation, my initial approach was when a user selects a verse I would load a number of suscequent verses in the slide into array and then use that array to map the buton forward and backward.. Now, you can think of the efficientcy issues with this approach. Turn out the data structure we learned back during the internet bootcamp was a important after all. 

#### 2. System wide rendering challenge.
The rendering is for example when a user selects a verse, the process the verse will go through from preview to final live presentation screen. The project underwent 3 main approaches for the current rendering process to finally work. 

1. The first approach was that I was naive and didn't plan this process very well. so my intention was to just create an object of what I want and send it to the screen and also this was my first electronjs applicaton and so I was not aware of the ipc and all that needs to be involved in moving a data from the database to another screen.

2. In my second approach, I began thinking of it as slide and was thinking of using object to compile what needs to be on the live screen and send it to the screen based on the slide type and i had multiple types such as scripture, placeholder, etc.