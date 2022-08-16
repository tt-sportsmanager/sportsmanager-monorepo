function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function convertTo18Points(v) {
  return v * (10 ** 18);
}

function convertFrom18Points(v) {
  return v / (10 ** 18);
}

module.exports = {
  sleep,
  convertTo18Points,
  convertFrom18Points
}