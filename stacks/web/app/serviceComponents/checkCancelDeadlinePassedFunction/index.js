exports.handler = (event, context, callback) => {  
    let timestamp = Number(event.timestamp) * 1000
    let now = Math.floor(new Date().getTime())
    
    if (now < timestamp) {
      return callback(null, false);
    }
    return callback(null, true);
  };
  