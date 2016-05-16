Object.defineProperty(String.prototype, 'findAll', {
    value: function(searchStr, caseSensitive) {
	var str = this,
	    startIndex = 0,
	    searchStrLen = searchStr.length,
	    index, indices = [],
	    caseSensitive = !!caseSensitive
	    if (!caseSensitive) {
		str = str.toLowerCase()
		searchStr = searchStr.toLowerCase()
	    }
	while ((index = str.indexOf(searchStr, startIndex)) > -1) {
	    indices.push(index)
	    startIndex = index + searchStrLen
	}
	return indices
    }
})

// polyfill for canvas toBlob method
if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
	value: function (callback, type, quality) {
	    var binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
		len = binStr.length,
		arr = new Uint8Array(len);
	    for (var i=0; i<len; i++) {
		arr[i] = binStr.charCodeAt(i);
	    }
	    callback( new Blob( [arr], {type: type || 'image/png'} ) );
	}
    });
}
function isMobile(){
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}
