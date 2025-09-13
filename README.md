# MPC Fill Cropper API

A tiny Node.js API that proxies images from `img.mpcautofill.com` and crops them according to specific print specifications.

## Features

- 🖼️ Proxies images from `img.mpcautofill.com`
- ✂️ Crops images based on 2.620×3.620 inch target size
- 🎯 Removes 0.12 inch borders from all sides
- 📏 Automatically calculates DPI for precise cropping
- ⚡ Fast image processing using HTML5 Canvas
- 🔍 Health check endpoint
- 📝 Comprehensive error handling

## Requirements

- Node.js 18.12.0+ (required for canvas v3 and native fetch API support)

### System Dependencies (for canvas v3)

**macOS:**
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
```

**Ubuntu/Debian:**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

**Windows:** See the [node-canvas installation guide](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows)

## Setup

1. **Install system dependencies** (see above)

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   # Production
   npm start
   
   # Development (with auto-reload)
   npm run dev
   ```

The server will start on port 3000 by default (or the port specified in the `PORT` environment variable).

## API Endpoints

### `GET /image/:id`
Fetches an image from `img.mpcautofill.com` and returns a cropped version.

**Parameters:**
- `id` (string): The image ID to fetch

**Example:**
```bash
curl http://localhost:3000/image/your-image-id > cropped-image.png
```

The API will:
1. Fetch the image from `https://img.mpcautofill.com/{id}-large-google_drive`
2. Calculate the DPI based on the target size of 2.620×3.620 inches
3. Remove 0.12 inches of pixels from all borders
4. Return the cropped image as PNG

### `GET /health`
Health check endpoint that returns server status.

### `GET /`
Returns API information and usage instructions.

## Image Processing Details

- **Target Size:** 2.620×3.620 inches
- **Border Removal:** 0.12 inches from each side
- **DPI Calculation:** Automatically calculated from original image dimensions
- **Output Format:** PNG
- **Caching:** Images are cached for 1 hour

## Error Handling

The API handles various error scenarios:
- Invalid or missing image ID
- Network timeouts (30 second limit)
- Image not found (404)
- Server unavailable (502)
- Processing errors (500)

## Environment Variables

- `PORT`: Server port (default: 3000)

## Dependencies

- **express**: Web framework (v5)
- **canvas**: Image processing and cropping (v3)
- **fetch**: Native Node.js fetch API for HTTP requests (Node.js 18.12.0+)

## License

AGPL-3.0
