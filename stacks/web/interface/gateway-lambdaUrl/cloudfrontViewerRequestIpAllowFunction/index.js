exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    //const response = event.Records[0].cf.response;
    const clientIp = request.clientIp;

    //list of stripe webhook ip addresses https://docs.stripe.com/ips
    const allowedIps = [
      "3.18.12.63",
      "3.130.192.231",
      "13.235.14.237",
      "13.235.122.149",
      "18.211.135.69",
      "35.154.171.200",
      "52.15.183.38",
      "54.88.130.119",
      "54.88.130.237",
      "54.187.174.169",
      "54.187.205.235",
      "54.187.216.72"
    ]

    if (!allowedIps.includes(clientIp)) {
      return {
        status: '403',
        statusDescription: 'Forbidden',
        body: 'Access denied',
        headers: {
          'content-type': [{ key: 'Content-Type', value: 'text/plain' }],
        },
      };
    }

    return callback(null, request);
  };