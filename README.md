# PollVault
A site for submitting and answering anonymous polls and questions. Built using Firebase + Facebook Auth and React. Design uses the Bootstrap framework.

You can check out a working version of the site at [pollvault.harryjiang.ca](http://pollvault.harryjiang.ca).
Or, if you want, you can install it on your own computer by cloning this repo and following the instructions in the "Setting up PollVault for yourself" section.

## Dependencies
* npm
* [babel](https://babeljs.io/)
* [bootstrap](http://getbootstrap.com/getting-started/)
* [firebase](https://firebase.google.com/docs/web/setup)
* [jquery](http://jquery.com/download/)
* [react](https://github.com/facebookincubator/create-react-app#create-react-app-)

Install all dependencies via npm.

## Setting up PollVault for yourself
If you want to set up your own version, you'll also need to setup a new [Firebase project](http://firebase.google.com) and link it to a [Facebook Dev](http://developers.facebook.com) project for authentication. Once you've linked your Firebase project to Facebook Dev and turned it on, retrieve a config file from your project on Firebase and copy it into line 18 in [`src/index.js`](https://github.com/svltaf/pollvault/blob/master/src/index.js).
Finally, run the following command to serve it locally:
```
npm start
```
or build a production version with the following command:
```
npm run build
```
and serve the built app with the contents of the new created `/build` folder.

