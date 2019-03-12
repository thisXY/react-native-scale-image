import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Image as RNImage, StyleSheet } from 'react-native';

/**
 * 图片
 */
class ScaleImage extends Component {
  static propTypes = {
    children: PropTypes.node,
    // 样式
    style: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.array]),
    // 获取RN图片ref
    imageRef: PropTypes.func,
    // 缩放模式
    resizeMode: PropTypes.oneOf(['cover', 'contain', 'stretch', 'repeat', 'center']),
    // 图片资源
    source: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  };

  static defaultProps = {
    children: null,
    style: null,
    imageRef: ref => ref,
    resizeMode: 'stretch',
    source: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      // 图片宽
      imageWidth: 0,
      // 图片高
      imageHeight: 0,
    };
  }

  componentDidMount() {
    this._getImageSize(this.props.source);
  }

  componentWillReceiveProps(nextProps) {
    const sourceType = typeof this.props.source;
    const nextSourceType = typeof nextProps.source;

    if (nextProps.resizeMode === 'stretch' && (
        nextProps.resizeMode !== this.props.resizeMode ||
        sourceType !== nextSourceType ||
        sourceType === 'number' && this.props.source !== nextProps.source ||
        sourceType === 'object' && this.props.source.uri !== nextProps.source.uri
      )) {
      this._getImageSize(nextProps.source);
    }
  }

  /**
   * 获取图片大小
   * @param source 图片资源
   * @private
   */
  _getImageSize = source => {
    this.setState({ imageWidth: 0, imageHeight: 0 });
    const setSize = (width, height) => this.setState({ imageWidth: width, imageHeight: height });

    // 网络图片
    if (typeof source === 'object') {
      RNImage.getSize(source.uri, setSize);
    }
    // 本地图片
    else {
      const sourceInfo = RNImage.resolveAssetSource(source);
      setSize(sourceInfo.width, sourceInfo.height);
    }
  }

  /**
   * 获取样式大小
   * @param sizeName 大小样式名
   * @param minSizeName 最小大小样式名
   * @param maxSizeName 最大大小样式名
   * @private
   */
  _getStyleSize = (sizeName, minSizeName, maxSizeName) => {
    const style = StyleSheet.flatten(this.props.style) || {};
    const getSize = styleName => (typeof style[styleName] === 'number' ? style[styleName] : 0);
    const size = getSize(sizeName);
    const minSize = getSize(minSizeName);
    const maxSize = getSize(maxSizeName);
    if (size) {
      return minSize && size < minSize ? minSize : maxSize && size > maxSize ? maxSize : size;
    }
    return minSize;
  }

  /**
   * 获取缩放比
   * @param size 大小
   * @param maxSize 最大大小
   * @private
   */
  _getScale = (size, maxSize) => {
    let showSize = size;
    maxSize = typeof maxSize === 'number' ? maxSize : 0;
    if (maxSize && showSize > maxSize) {
      showSize = maxSize;
    }
    return showSize / size;
  }

  render() {
    const style = StyleSheet.flatten(this.props.style) || {};
    const imageStyle = {};

    if (this.props.resizeMode === 'stretch' && this.state.imageWidth && this.state.imageHeight) {
      const width = this._getStyleSize('width', 'minWidth', 'maxWidth');
      const height = this._getStyleSize('height', 'minHeight', 'maxHeight');
      let scale = null;

      if (width && height) {
        imageStyle.width = width;
        imageStyle.height = height;
      }
      else if (!width && !height) {
        const widthScale = this._getScale(this.state.imageWidth, style.maxWidth);
        const heightScale = this._getScale(this.state.imageHeight, style.maxHeight);
        scale = widthScale > heightScale ? heightScale : widthScale;
      }
      else {
        scale = width ? width / this.state.imageWidth : height / this.state.imageHeight;
      }

      if (scale !== null) {
        imageStyle.width = this.state.imageWidth * scale;
        imageStyle.height = this.state.imageHeight * scale;
      }
    }

    return (
      <RNImage
        {...this.props}
        ref={this.props.imageRef}
        source={this.props.resizeMode === 'stretch' && (!this.state.imageWidth || !this.state.imageHeight) ? null : this.props.source}
        style={[styles.container, this.props.style, imageStyle]}
      />
    );
  }
}

export default ScaleImage;
