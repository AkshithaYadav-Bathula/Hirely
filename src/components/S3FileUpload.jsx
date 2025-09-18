import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import {
  AWS_ACCESS_KEY_ID,
  AWS_ACCESS_KEY,
  AWS_BUCKET,
  AWS_REGION,
  VIDEO_FILE_SIZE_LIMIT,
  VIDEO_INPUT_S3_URL,
  VIDEO_DELETE_S3_URL
} from '../awsConfig';

const S3FileUpload = ({
  value,
  onChange,
  name,
  fileType = 'file', // 'image', 'video', 'file'
  folder = '',
  sizeLimit = 10 * 1024 * 1024, // 10MB default
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

  const handleFileUpload = async ({ file, onSuccess, onError }) => {
    if (!file) {
      onError(new Error('No file uploaded'));
      return;
    }
    if (file.size > sizeLimit) {
      setErrorState(`File size exceeds the limit of ${Math.round(sizeLimit / 1024 / 1024)}MB`);
      return;
    }
    setErrorState('');
    setUploading(true);

    const s3 = new AWS.S3({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_ACCESS_KEY,
      region: AWS_REGION,
    });

    const uniqueId = nanoid(5);
    const uniqueFileName = `${folder}${uniqueId}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;
    const params = {
      Bucket: AWS_BUCKET,
      Key: uniqueFileName,
      Body: file,
      ContentType: file.type,
      ACL: 'public-read'
    };

    s3.upload(params, (err, data) => {
      setUploading(false);
      if (err) {
        setErrorState(`Error: ${err.message}`);
        onError(new Error('Upload failed'));
        return;
      }
      onChange({ target: { name, value: data.Location } });
      onSuccess(uniqueFileName, file);
    });
  };

  const handleDelete = async (fileUrl) => {
    if (!deleteEnabled) return false;
    try {
      const fileName = fileUrl.split('/').pop();
      setUploading(true);
      const response = await fetch(`${VIDEO_DELETE_S3_URL}?bucketname=${AWS_BUCKET}&filename=${fileName}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      setUploading(false);
      if (response.status === 200 || response.status === 404) {
        onChange({ target: { name, value: '' } });
        return true;
      } else {
        message.error('Error deleting file');
        return false;
      }
    } catch (error) {
      setUploading(false);
      message.error('Error deleting file');
      return false;
    }
  };

  const props = {
    accept,
    customRequest: handleFileUpload,
    onRemove: async (file) => await handleDelete(file.url),
    defaultFileList,
    showUploadList: { showRemoveIcon: deleteEnabled }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontWeight: 600 }}>{label}</label>
      <Upload {...props} disabled={disabled || uploading}>
        <Button icon={<UploadOutlined />} loading={uploading} disabled={!!value || disabled}>
          {uploading ? 'Uploading...' : 'Click to Upload'}
        </Button>
      </Upload>
      {errorState && <div style={{ color: 'red', marginTop: 8 }}>{errorState}</div>}
      {showPreview && value && fileType === 'image' && (
        <img src={value} alt="preview" style={{ width: 120, marginTop: 8, borderRadius: 8 }} />
      )}
      {showPreview && value && fileType === 'video' && (
        <video src={value} controls width="320" style={{ marginTop: 8, borderRadius: 8 }} />
      )}
      {showPreview && value && fileType === 'file' && (
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 8, color: "#4338ca" }}>
          View File
        </a>
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
  deleteEnabled: PropTypes.bool,
};

export default S3FileUpload;