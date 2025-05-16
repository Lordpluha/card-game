import liveServer from "live-server";
import {HOST, PORT} from "./config.js"

var params = {
	port: PORT,
	host: HOST,
	open: true,
	logLevel: 2,
};

liveServer.start(params);