# Custom Dark Forest Client

my combination of useful custom client modifications for power users. history is as follows:

1. originally forked from https://github.com/adietrichs/client
2. made minor changes to allow running under windows by default
3. updated to include https://github.com/phated/v06-round3-client

## Installation

1. Install latest version of Node from https://nodejs.org/en/download/
2. Install yarn using `npm install --global yarn` since npm is now installed since it's bundled with Node.js
3. Run `yarn` inside the `client` folder to install dependencies

## Running

Run `runclient.bat` to run in Windows

When asked you can use your whitelist key or import your mainnet burner secret and home coordinates.

### Plugin development

You can develop plugins for Dark Forest either inside this game client repository, or externally using something like https://github.com/Bind/my-first-plugin. In either case, you'll want to use the [`df-plugin-dev-server`](https://github.com/projectsophon/df-plugin-dev-server).

You can install it as a global command, using:

```sh
npm install -g @projectsophon/df-plugin-dev-server
```

Once it is installed, you can run it inside this project repository, using:

```sh
df-plugin-dev-server
```

You can then add or modify any plugins inside the [`plugins/`](./plugins) directory and they will be automatically bundled and served as plugins you can import inside the game!

And then load your plugin in the game client, like so:

```js
// Replace PluginTemplate.js with the name of your Plugin
// And `.ts` extensions become `.js`
export { default } from 'http://127.0.0.1:2222/PluginTemplate.js?dev';
```

### Embedded plugins

The Dark Forest client ships with some game "plugins" embedded in the game client. The source code for these plugins exists at [`embedded_plugins/`](./embedded_plugins). You are able to edit them inside the game and the changes will persist. If you change the source code directly, you must delete the plugin in-game and reload your browser to import the new code.
