const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a Buffer to Cloudinary using upload_stream
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Cloudinary upload options (folder, public_id, etc.)
 * @returns {Promise<Object>}
 */
function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'qarwaan/uploads',
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Upload a file by filepath to Cloudinary
 * @param {string} filePath - Absolute or relative file path
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>}
 */
function uploadFilePath(filePath, options = {}) {
  return cloudinary.uploader.upload(filePath, {
    folder: 'qarwaan/uploads',
    resource_type: 'image',
    ...options,
  });
}

/**
 * Delete a resource from Cloudinary
 * @param {string} publicId - The public ID of the resource
 * @param {Object} options - Options
 * @returns {Promise<Object>}
 */
function deleteResource(publicId, options = {}) {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
    ...options,
  });
}

module.exports = {
  cloudinary,
  uploadBuffer,
  uploadFilePath,
  deleteResource,
};
