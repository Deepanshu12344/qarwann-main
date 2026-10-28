const asyncHandler = require('express-async-handler');
const { uploadBuffer, deleteResource } = require('../services/cloudinary.service');

// POST /api/uploads/image
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided. Use field name "image".');
  }

  const folder = req.body.folder && typeof req.body.folder === 'string'
    ? req.body.folder.replace(/[^a-zA-Z0-9_\-\/]/g, '')
    : 'qarwaan/uploads';

  const result = await uploadBuffer(req.file.buffer, {
    folder,
    resource_type: 'image',
  });

  res.status(201).json({
    success: true,
    image: {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    },
  });
});

// POST /api/uploads/images
const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No image files provided. Use field name "images".');
  }

  const folder = req.body.folder && typeof req.body.folder === 'string'
    ? req.body.folder.replace(/[^a-zA-Z0-9_\-\/]/g, '')
    : 'qarwaan/uploads';

  const uploadPromises = req.files.map((file) =>
    uploadBuffer(file.buffer, {
      folder,
      resource_type: 'image',
    })
  );

  const results = await Promise.all(uploadPromises);

  const images = results.map((result) => ({
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  }));

  res.status(201).json({
    success: true,
    images,
  });
});

// DELETE /api/uploads/* or /api/uploads?publicId=...
const deleteImage = asyncHandler(async (req, res) => {
  // Can be passed via wildcard param (*), param, query, or body
  const publicId = req.params[0] || req.params.publicId || req.query.publicId || req.body.publicId;

  if (!publicId) {
    res.status(400);
    throw new Error('Public ID is required to delete image');
  }

  const result = await deleteResource(publicId);

  res.json({
    success: true,
    message: 'Image deletion requested',
    result,
  });
});

module.exports = {
  uploadImage,
  uploadImages,
  deleteImage,
};
