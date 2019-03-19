Object.entries = function (obj) {
  var ownProps = Object.keys(obj);
  var resArray = new Array(ownProps.length).fill(null);

  for (var i = 0; i < ownProps.length; i++) {
    resArray[i] = [ownProps[i], obj[ownProps[i]]];
  }

  return resArray;
};
