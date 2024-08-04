exports.handler = async function (event, context, callback) {
    let firstNumber = event.firstNumber
    let secondNumber = event.secondNumber
    let result = firstNumber - secondNumber
    return result;
};
