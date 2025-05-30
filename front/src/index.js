import liveServer from "live-server";
import {HOST, PORT, NODE_ENV} from "./config.js"

var params = {
	port: PORT,
	host: HOST,

	open: true,
	logLevel: 2,
	file: 'index.html',
	root: 'src'
};

console.log(`Using: ${NODE_ENV} environment`)
liveServer.start(params);