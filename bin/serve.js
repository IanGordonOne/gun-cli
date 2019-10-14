const colors = require('colors/safe')

module.exports = function cmd_serve(config, cb) {
	if(config.debug)
		process.env.GUN_ENV = 'debug'

	if(config.peers)
		config.peers = config.peers.split(',').reduce((acc,peer) => {
			acc[peer] = {}
			return acc
		}, {})

	const Gun = require('gun')
	const gun_path = require('gun/lib/path')
	let server

	if(config.certs) {
		const fs = require('fs')
		const path = require('path')
		try {
			const http_config =
				{	key: fs.readFileSync(path.resolve(config.certs, 'privkey.pem'),)
				,	cert: fs.readFileSync(path.resolve(config.certs, 'fullchain.pem'),)
				,	ca: fs.readFileSync(path.resolve(config.certs, 'chain.pem'))
				}
			server = require('https').createServer(http_config)
		}
		catch(https_ex) {
			console.log(`https_ex`, https_ex)
			return cb(301, 'could not start an https server')
		}
	}
	else {
		server = require('http').createServer()
	}

	server.listen(config.port, config.host)
	const gun = Gun({...config, web: server})

	function watch(pth, cb) {
		if(!pth)
			return cb()
		gun.path(pth).once(_ => {
			console.log(colors.gray(`Watch: ${colors.yellow(pth)}`))

			cb()
			gun.path(pth).on(data => {
				console.log(`${(new Date()).toLocaleTimeString()}\t${colors.yellow(pth)} =>`, colors.brightGreen(JSON.stringify(data, null, '\t')))
			})
		})
	}

	function afterinit() {
		const server_url = colors.brightBlue.underline(`${config.certs ? 'https':'http'}://${config.host}:${config.port}/gun`)
		const peers = config.peers && Object.keys(config.peers).map(p => colors.yellow(p)).join(', ')
		console.log()
		console.log(`Gun node running at ${server_url}`)
		console.log()
		console.log(colors.gray(`File:  ${colors.yellow(config.file)}`))

		if(config.certs)
			console.log(colors.gray(`Certs: ${colors.yellow(config.certs)}`))
		if(peers)
			console.log(colors.gray(`Peers: ${peers}`))
		watch(config.watch, cb)
	}

	// use setTimeout to print after the output on Gun()
	setTimeout(afterinit)
	return {gun}
}