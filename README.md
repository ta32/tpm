# Temporary Password Manager

PWA app replacement for the Trezor Password Manager.

This branch contains a prototype of the app that is an offline-first PWA app (code not served from a server).
The app still needs network access to sync with Dropbox, although I do plan to have an option to sync with a local file.

**Note:** You will need to create your own Dropbox OAuth account and update the required configuration as described below to use this app.

You will need to create a ```.env.local``` file in the root directory

with the following content

```text
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/
NEXT_PUBLIC_CLIENT_ID=XXXX-CREATE-YOUR-OWN-APP-AND-GET-CLIENT-ID-HERE-XXXX
```

## About this Project

* A free and open-source password manager

* Password manager that protects all your passwords **without** a master password

## Build and Install

Checkout the project and run the following commands:

### Install pre-requisites
- Node.js
- npx serve: ```npm install -g serve``` installs it globally

### Build and install PWA

```shell
npm install
npm run build
npx serve out
# open the browser and navigate to http://localhost:3000 and install the PWA app
```

## Todo

- [ ] Determine how to make an installer to automate the installation process for all platforms.

I would really like to figure out how to create offline-first web apps where a user could download a package from GitHub, verify it, and install it locally. Because the code for your app is installed on your machine you are no longer vulnerable to phishing attacks, or MITM attacks like you would when navigating to a traditional DApp website. 

Users can also download the source code, build and run it locally to install the app.