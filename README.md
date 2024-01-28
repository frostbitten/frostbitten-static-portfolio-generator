# Portfolio Generator

Generate a static portfolio website suitable for uploading to serverless hosting.

## Data, where to put it

Store your projects in the `/work` folder using this naming mechanism: `/work/{year}/{project}` where `{year}` is the year the work was released and `{project}` is the all-lowercase, no spaces name for your project.

So, if you did Charcoal Portraiture in 2022 you'd create a folder named `portraiture-with-charcoal` inside a `2022` folder inside `work`.

Store media for your project in a subfolder, `{project}/media`. Images and video that sit in that directory will automatically show up as media in your project gallery.

## Video media best practices

I suggest keeping any video larger than 10MB on a video hosting service.

Supported video services:

  * **Cloudflare Stream** - Create a text file in your media folder with the filename of your video followed by `.cfstream.json`. For example: `my-video.mp4.cfstream.json`. Copy and paste the contents from the JSON tab of the video's configuration in Cloudflare Stream.

You can keep the original video file in a new subfolder named `!etc` if you want to keep it close. Any file or folder that contains an `!` exclamation point will be ignored.

## Previewing and devloping your site

Run `npm run dev` and your project will continuously update as you edit the contents of `work`.

## Generating the static site

1. run `npm run build`

2. When complete, you can copy the contents of the `build` folder to your web host

## Uploading to your web host

I use Digital Ocean's free app hosting. But you can also upload to IPFS.