# Dark Forest Client

## Development Guide

### Installing Core Dependencies

- Node (v14.15.x)
- Yarn (Javascript Package Manager)

#### Installing The Correct Node Version Using NVM

Dark Forest is built and tested using Node.js v14.15.x and might not run properly on other Node.js versions. We

For Windows: Install node.js from their site, I've tested it working with v14.17.

For Linux: Dark Forest team recommends using NVM to switch between multiple Node.js version on your machine.

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
nvm install
```

After the installation is finished, you can run `node --version` to verify that you are running v14.15.x

#### Installing Yarn

Refer to [Yarn's official documentation](https://classic.yarnpkg.com/en/docs/install) for the installation guide.

After you have Yarn installed, run `yarn` to install the dependencies:

### Installing the client

After you have node.js and yarn installed, `git clone` this repo and run `yarn` inside the base folder. It should take a few minutes to install and build all the required dependencies. If it fails anywhere in this process, do not try and recover. Fix what you think the issue was, but then **delete and re-clone the entire folder** before running `yarn` again.

### Running the client

To connecting to the mainnet client, simply run `yarn start:prod`. When asked you can use your whitelist key or import your mainnet burner secret and home coordinates.

For Windows: create a .bat file that contains:
```
set NODE_ENV=production
yarn start:prod
```

For Linux: create a script that contains:
```
NODE_ENV=production
yarn start:prod
```

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
