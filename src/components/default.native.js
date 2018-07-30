const brandPrimary = '#108ee9';
const brandPrimaryTap = '#1284d6';

export default {
  // 支付宝钱包默认主题 - Alipay wallet default theme
  // https://github.com/ant-design/ant-design-mobile/wiki/设计变量表及命名规范
  // 色彩, NOTE: must use `#000000` instead of `#000`
  // https://facebook.github.io/react-native/docs/colors.html
  // 8-digit-hex to 4-digit hex https://css-tricks.com/8-digit-hex-codes/
  // https://www.chromestatus.com/feature/5685348285808640 chrome will support `#RGBA`

  // 文字色 - Text color
  color_text_base: '#000000', // 基本
  color_text_base_inverse: '#ffffff', // 基本 _ 反色 - basic, reverse color
  color_text_secondary: '#a4a9b0', // 辅助色 - Auxiliary color
  color_text_placeholder: '#bbbbbb', // 文本框提示 - text box prompt
  color_text_disabled: '#bbbbbb', // 失效
  color_text_caption: '#888888', // 辅助描述 - Help description
  color_text_paragraph: '#333333', // 段落
  color_link: brandPrimary, // 链接 - link
  // 背景色
  fill_base: '#ffffff', // 组件默认背景 - assembly default background
  fill_body: '#f5f5f9', // 页面背景 - page background
  fill_tap: '#dddddd', // 组件默认背景 _ 按下 - Component default background _ press
  fill_disabled: '#dddddd', // 通用失效背景 - general invalidation background
  fill_mask: 'rgba(0, 0, 0, .4)', // 遮罩背景 - mask background
  color_icon_base: '#cccccc', // 许多小图标的背景，比如一些小圆点，加减号 - The background of many small icons, such as some small dots, plus and minus
  fill_grey: '#f7f7f7',

  // 透明度
  opacity_disabled: '0.3', // switch checkbox radio 等组件禁用的透明度 - and other components disabled transparency

  // 全局/品牌色 - Global/brand color
  brand_primary: brandPrimary,
  brand_primary_tap: brandPrimaryTap,
  brand_success: '#6abf47',
  brand_warning: '#f4333c',
  brand_error: '#f4333c',
  brand_important: '#ff5b05', // 用于小红点 - for small red dots
  brand_wait: '#108ee9',

  // 边框色 - Border color
  border_color_base: '#dddddd',

  // 字体尺寸 - font size
  // ---
  font_size_icontext: 10,
  font_size_caption_sm: 12,
  font_size_base: 14,
  font_size_subhead: 15,
  font_size_caption: 16,
  font_size_heading: 17,

  // 圆角 - Rounding
  // ---
  radius_xs: 2,
  radius_sm: 3,
  radius_md: 5,
  radius_lg: 7,

  // 边框尺寸 - Border size
  // ---
  border_width_sm: 0.5,
  border_width_md: 1,
  border_width_lg: 2,

  // 间距 - pitch
  // ---
  // 水平间距 - horizontal spacing
  h_spacing_sm: 5,
  h_spacing_md: 8,
  h_spacing_lg: 15,

  // 垂直间距 - Vertical spacing
  v_spacing_xs: 3,
  v_spacing_sm: 6,
  v_spacing_md: 9,
  v_spacing_lg: 15,
  v_spacing_xl: 21,

  // 高度 - height
  // ---
  line_height_base: 1, // 单行行高 - single line height
  line_height_paragraph: 1.5, // 多行行高 - multiple row height
  // 图标尺寸
  // ---
  icon_size_xxs: 15,
  icon_size_xs: 18,
  icon_size_sm: 21,
  icon_size_md: 22, // 导航条上的图标 - the icon on the navigation bar
  icon_size_lg: 36,

  // 动画缓动 - Animation easing
  // ---
  ease_in_out_quint: 'cubic_bezier(0.86, 0, 0.07, 1)',

  // 组件变量 - Component variables
  // ---
  actionsheet_item_height: 50,
  actionsheet_item_font_size: 18,

  // button
  button_height: 47,
  button_font_size: 18,

  button_height_sm: 23,
  button_font_size_sm: 12,

  primary_button_fill: brandPrimary,
  primary_button_fill_tap: '#0e80d2',

  ghost_button_color: brandPrimary, // 同时应用于背景、文字颜色、边框色 - applied to the background, text color, border color
  ghost_button_fill_tap: `${brandPrimary}99`, // alpha 60% https://codepen.io/chriscoyier/pen/XjbzAW
  warning_button_fill: '#e94f4f',
  warning_button_fill_tap: '#d24747',

  link_button_fill_tap: '#dddddd',
  link_button_font_size: 16,

  // modal
  modal_font_size_heading: 18,
  modal_button_font_size: 18, // 按钮字号 - button font size
  modal_button_height: 50, // 按钮高度 - button height
  // list
  list_title_height: 30,
  list_item_height_sm: 35,
  list_item_height: 44,

  // input
  input_label_width: 17, // InputItem、TextareaItem 文字长度基础值 - InputItem, TextareaItem text length base value
  input_font_size: 17,
  input_color_icon: '#cccccc',
  input_color_icon_tap: brandPrimary,

  // tabs
  tabs_color: brandPrimary,
  tabs_height: 42,
  tabs_font_size_heading: 15,

  // segmented_control
  segmented_control_color: brandPrimary, // 同时应用于背景、文字颜色、边框色 - applied to the background, text color, border color
  segmented_control_height: 27,
  segmented_control_fill_tap: `${brandPrimary}10`,

  // tab_bar
  tab_bar_fill: '#ebeeef',
  tab_bar_height: 50,

  // toast
  toast_fill: 'rgba(0, 0, 0, .8)',

  // search_bar
  search_bar_fill: '#efeff4',
  search_bar_height: 44,
  search_bar_input_height: 28,
  search_bar_font_size: 15,
  search_color_icon: '#bbbbbb', // input search icon 的背景色
  // notice_bar
  notice_bar_fill: '#fffada',
  notice_bar_height: 36,

  // switch
  switch_fill: '#4dd865',

  // tag
  tag_height: 25,
  tag_small_height: 15,

  // picker
  option_height: 42, // picker 标题的高度 - the height of the picker title
  toast_zindex: 1999,
  action_sheet_zindex: 1000,
  popup_zindex: 999,
  modal_zindex: 999,
};
