// gettext
// todo
function _(m){return m}


function log(m){
	if(config.logging){
		if(m.length > config.log_max_length)
			m = m.substr(0,config.log_max_length)
		console.log(m)
	}
}

function pass(){
	// use as empty callback
}