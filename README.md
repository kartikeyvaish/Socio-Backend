# Socio Backend

<p align="center">
  <img width="200" src="https://i.imgur.com/NSZRbpr.png" />
</p>

Socio is a social networking platform where users can pictures and videos as Posts with the world.
Users can chat with each other through real time.

## Features

- Users can create an account
- Users can login
- Users can upload pictures and videos as Posts
- Users can chat with each other through real time
- Users can like and comment on Posts
- Users can follow other users
- Users can view Posts, Profile, Comments and Likes of own as well as other users
- Users will recieve notifications when they are followed etc.

## Development Setup

To set up Socio for development, you need to install the following dependencies:

- Install [Node](https://nodejs.org/en/)
- Install [MongoDB](https://www.mongodb.com/download-center/community)
- Create a `.env` file for environment variables

Follow these steps to set up the development environment:

### Step 1: Install Node.js from the [Node.js official website](https://nodejs.org/en/).

During the developement process, I used node version v14.17.4. You can check your node version by running the following command:

```shell
node -v
```

### Step 2: Install MongoDB from the [MongoDB official website](https://www.mongodb.com/download-center/community).

My MongoDB shell version `v5.0.2-rc0`

### Step 3: Install [MongoDB Compass](https://www.mongodb.com/products/compass) and [Postman](https://www.postman.com/) (Optional)

You may want to install these two tools to help you with the development process.
Using MongoDB Compass, you can have a look at your database as it gives a nice overview of your database.
Postman can be used to test API endpoints.

### Step 4: Create a `.env` file for environment variables

You'll have to create a `.env` file for environment variables with the variables listed [here](https://github.com/kartikeyvaish/Socio-Backend/blob/main/README.md#env-file)

### Step 5: Clone the repository

    git clone https://github.com/kartikeyvaish/Socio-Backend.git

### Step 6: Install dependencies

    cd Socio-Backend

    npm install

### Step 7: Run the server

    npm run dev

#### .env file

```dosini
// development or production
NODE_ENV="development"

// Local Database Configurations
DB_Name="Socio"

// MongoDB Atlas Configurations
atlas_url="your_mongo_db_atlas_url_if_any"
apiVersion="api_version_if_any"

// JWT keys
OTP_Email_Send_Key=""
SignUP_API_KEY=""
access_token_key_creator=""
refresh_token_key_creator=""
payload_key_creator=""

// Endpoints Here
auth=""
otp=""
posts="" 
people=""
profile=""
stories=""
chats=""

// Cloudinary Settings Below
CLOUDINARY_URL=""
CLOUDINARY_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

default_profile_picture="default_image_url"
default_channel_id=""

// Firebase SDK Json creds
project_id=""
client_email=""
private_key=""

// Google Sign-In Client ID
googleApiClientID=""
webClientID=""
```
