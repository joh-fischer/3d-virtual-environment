# 3D Virtual Environment

For a project in my master studies I had to create a 3D virtual communication environment with JavaScript that runs in the browser. The rooms were designed and created with blender, back-end implemented with Node.js, and the front-end with JavaScript, HTML, and CSS. The 3D scene was rendered using the 3D graph library ```rendeer.js``` which can be found [here](https://github.com/jagenjo/rendeer.js).

The result looks like [this](https://youtu.be/3ykdngrXfb8) (youtube video):

[![Watch the video](https://img.youtube.com/vi/3ykdngrXfb8/maxresdefault.jpg)](https://youtu.be/3ykdngrXfb8)

Features included:
- general chat
- friendslist (stored in the database)
- private chat with friends (stored in the redis database)
- change the look of avatar
- change your login credentials
- re-login with locally stored token or completely log-out
- different rooms with individual information for each artwork
