import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { nanoid } from 'nanoid';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Frontend-safe env variables
const AWS_REGION = import.meta.env.VITE_AWS_REGION || '';
const AWS_BUCKET = import.meta.env.VITE_AWS_BUCKET || '';
const AWS_ACCESS_KEY_ID = import.meta.env.VITE_AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '';
const VIDEO_INPUT_S3_URL = import.meta.env.VITE_VIDEO_INPUT_S3_URL || '';
const VIDEO_DELETE_S3_URL = import.meta.env.VITE_VIDEO_DELETE_S3_URL || '';

const S3FileUpload = ({
  value,
  onChange,
  name,
  fileType = 'file',
  folder = '',
  sizeLimit = 10 * 1024 * 1024,
  accept = '*',
  label = 'Upload File',
  disabled = false,
  showPreview = true,
  deleteEnabled = true
}) => {
  const [uploading, setUploading] = useState(false);
  const [errorState, setErrorState] = useState('');
  const [defaultFileList, setDefaultFileList] = useState([]);

  useEffect(() => {
    if (value) {
      setDefaultFileList([{
        uid: '1',
        name: value.split('/').pop(),
        status: 'done',
        url: value,
        showRemoveIcon: true
      }]);
      setErrorState('');
    } else {
      setDefaultFileList([]);
      setErrorState('');
    }
  }, [value]);

  // Upload file to S3
  const handleFileUpload = async ({ file, onSuccess, onError }) => {
    if (!file) return onError(new Error('No file selected'));

    if (file.size > sizeLimit) {
      setErrorState(`File exceeds ${Math.round(sizeLimit / 1024 / 1024)}MB limit`);
      return onError(new Error('File too large'));
    }

    setUploading(true);
    setErrorState('');

    const s3 = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      }
    });

    const uniqueFileName = `${folder}${nanoid(5)}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;
    const params = {
  Bucket: AWS_BUCKET,
  Key: uniqueFileName,
  Body: file.originFileObj || file,
  ContentType: file.type,
  ACL: 'public-read'
};


    try {
      await s3.send(new PutObjectCommand(params));
      const fileUrl = `${VIDEO_INPUT_S3_URL}${uniqueFileName}`;
      onChange({ target: { name, value: fileUrl } });
      onSuccess(uniqueFileName, file);
    } catch (err) {
      setErrorState(`Upload failed: ${err.message}`);
      onError(err);
    } finally {
      setUploading(false);
    }
  };

  // Delete file from S3
  const handleDelete = async (fileUrl) => {
    if (!deleteEnabled || !fileUrl) return false;

    const fileName = fileUrl.split('/').pop();
    try {
      setUploading(true);
      const res = await fetch(`${VIDEO_DELETE_S3_URL}?bucketname=${AWS_BUCKET}&filename=${fileName}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok || res.status === 404) {
        onChange({ target: { name, value: '' } });
        return true;
      } else {
        message.error('Failed to delete file');
        return false;
      }
    } catch {
      message.error('Failed to delete file');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    accept,
    customRequest: handleFileUpload,
    onRemove: async file => await handleDelete(file.url),
    defaultFileList,
    showUploadList: { showRemoveIcon: deleteEnabled },
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontWeight: 600 }}>{label}</label>
      <Upload {...uploadProps} disabled={disabled || uploading}>
        <Button icon={<UploadOutlined />} loading={uploading} disabled={!!value || disabled}>
          {uploading ? 'Uploading...' : 'Click to Upload'}
        </Button>
      </Upload>

      {errorState && <div style={{ color: 'red', marginTop: 8 }}>{errorState}</div>}

      {showPreview && value && fileType === 'image' && <img src={value} alt="preview" style={{ width: 120, marginTop: 8, borderRadius: 8 }} />}
      {showPreview && value && fileType === 'video' && <video src={value} controls width="320" style={{ marginTop: 8, borderRadius: 8 }} />}
      {showPreview && value && fileType === 'file' && (
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 8, color: "#4338ca" }}>View File</a>
      )}
    </div>
  );
};

S3FileUpload.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  fileType: PropTypes.oneOf(['image', 'video', 'file']),
  folder: PropTypes.string,
  sizeLimit: PropTypes.number,
  accept: PropTypes.string,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  showPreview: PropTypes.bool,
  deleteEnabled: PropTypes.bool
};

export default S3FileUpload;
