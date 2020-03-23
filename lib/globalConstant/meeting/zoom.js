class ZoomConstant {
  get apiKey() {
    return process.env.PA_ZOOM_JWT_API_KEY;
  }

  get apiSecret() {
    return process.env.PA_ZOOM_JWT_API_SECRET;
  }
}

module.exports = new ZoomConstant();
