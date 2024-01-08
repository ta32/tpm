# Temporary Password Manager

This example uses [`next-pwa`](https://github.com/shadowwalker/next-pwa) to create a progressive web app (PWA) powered by [Workbox](https://developers.google.com/web/tools/workbox/).

## About this Project

* A free and open-source password manager

* password manager that protects all your passwords **without** a master password

* password manager where the encrypted passwords is synced online using a storage account you control

These requirements were met by the Trezor Password Manager (TPM), but was sadly deprecated.
This project aims to re-build this Chrome extension as a PWA-WebAPP, but with better offline support 
and a more trustless way for users to install the app.

see Wiki for more information: https://github.com/ta32/tpm/wiki

## Build and Install locally

 TODO: add instructions


### Running on non-localhost origin

Starting the dev server with TLS
```shell
next dev --experimental-https
```
Edit the host file to point a domain e.g. tmp.local to 127.0.0.1
Then run the server with TLS support. This allows the app to be tested
with an Origin URL that is not localhost, by connecting to https://tmp.local:3000

Without TLS CORS policy of chrome will block the app making requests to the Trezor Bridge
