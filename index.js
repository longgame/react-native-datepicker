import React, {Component} from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableHighlight,
  DatePickerAndroid,
  TimePickerAndroid,
  DatePickerIOS,
  Platform,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import Style from './style';
import Moment from 'moment';
const timer = require('react-native-timer');

const FORMATS = {
  'date': 'YYYY-MM-DD',
  'datetime': 'YYYY-MM-DD HH:mm',
  'time': 'HH:mm'
};

class DatePicker extends Component {
  constructor(props) {
    super(props);

    this.format = this.props.format || FORMATS[this.props.mode];

    this.state = {
      date: this.getDate(),
      modalVisible: false,
      invisibleBlocker: false,
      dateChanged: false,
      disabled: this.props.disabled,
      animatedHeight: new Animated.Value(0)
    };

    this.datePicked = this.datePicked.bind(this);
    this.onPressDate = this.onPressDate.bind(this);
    this.onPressCancel = this.onPressCancel.bind(this);
    this.onPressConfirm = this.onPressConfirm.bind(this);
    this.onDatePicked = this.onDatePicked.bind(this);
    this.onTimePicked = this.onTimePicked.bind(this);
    this.onDatetimePicked = this.onDatetimePicked.bind(this);
    this.onDatetimeTimePicked = this.onDatetimeTimePicked.bind(this);
    this.setModalVisible = this.setModalVisible.bind(this);
  }

  componentWillMount() {
    // ignore the warning of Failed propType for date of DatePickerIOS, will remove after being fixed by official
    console.ignoredYellowBox = [
      'Warning: Failed propType'
      // Other warnings you don't want like 'jsSchedulingOverhead',
    ];

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
      onPanResponderGrant: this._handlePanResponderGrant.bind(this),
      onPanResponderMove: this._handlePanResponderMove.bind(this),
      onPanResponderRelease: this._handlePanResponderEnd.bind(this),
      onPanResponderTerminate: this._handlePanResponderEnd.bind(this),
    });
  }

  _handleStartShouldSetPanResponder(e: Object, gestureState: Object): boolean {
    // Should we become active when the user presses down on the circle?
    return true;
  }

  _handleMoveShouldSetPanResponder(e: Object, gestureState: Object): boolean {
    // Should we become active when the user moves a touch over the circle?
    return Math.abs(gestureState.dx) > 5;
  }

  _handlePanResponderGrant(e: Object, gestureState: Object) {
    this.setState({
      dateChanged: true
    });
  }

  _handlePanResponderMove(e: Object, gestureState: Object) {

  }

  _handlePanResponderEnd(e: Object, gestureState: Object) {

  }

  setModalVisible(visible) {
    this.setState({modalVisible: visible});

    // slide animation
    if (visible) {
      Animated.timing(
        this.state.animatedHeight,
        {
          toValue: this.props.height,
          duration: this.props.duration
        }
      ).start();
    } else {
      this.setState({
        animatedHeight: new Animated.Value(0)
      });
    }
  }

  onPressCancel() {
    this.setModalVisible(false);
  }

  onPressConfirm() {
    this.datePicked();
    this.setModalVisible(false);
  }

  getDate(date = this.props.date) {
    // date默认值
    if (!date) {
      let now = new Date();
      if (this.props.minDate) {
        let minDate = this.getDate(this.props.minDate);

        if (now < minDate) {
          return minDate;
        }
      }

      if (this.props.maxDate) {
        let maxDate = this.getDate(this.props.maxDate);

        if (now > maxDate) {
          return maxDate;
        }
      }

      return now;
    }

    if (date instanceof Date) {
      return date;
    }

    return Moment(date, this.format).toDate();
  }

  getDateStr(date = this.props.date) {
    if (date instanceof Date) {
      return Moment(date).format(this.format);
    } else {
      return Moment(this.getDate(date)).format(this.format);
    }
  }

  datePicked() {
    if (typeof this.props.onDateChange === 'function') {
      this.props.onDateChange(this.getDateStr(this.state.date), this.state.date);
    }
  }

  getTitleElement() {
    const {date, placeholder} = this.props;
    if (!date && placeholder) {
      return (<Text style={[Style.placeholderText, this.props.customStyles.placeholderText]}>{placeholder}</Text>);
    }
    return (<Text style={[Style.dateText, this.props.customStyles.dateText]}>{this.getDateStr()}</Text>);
  }

  onDatePicked({action, year, month, day}) {
    if (action !== DatePickerAndroid.dismissedAction) {
      this.setState({
        date: new Date(year, month, day)
      });
      this.datePicked();
    }
  }

  onTimePicked({action, hour, minute}) {
    if (action !== DatePickerAndroid.dismissedAction) {
      this.setState({
        date: Moment().hour(hour).minute(minute).toDate()
      });
      this.datePicked();
    }
  }

  onDatetimePicked({action, year, month, day}) {
    if (action !== DatePickerAndroid.dismissedAction) {
      let timeMoment = Moment(this.state.date);

      TimePickerAndroid.open({
        hour: timeMoment.hour(),
        minute: timeMoment.minutes(),
        is24Hour: !this.format.match(/h|a/)
      }).then(this.onDatetimeTimePicked.bind(this, year, month, day));
    }
  }

  onDatetimeTimePicked(year, month, day, {action, hour, minute}) {
    if (action !== DatePickerAndroid.dismissedAction) {
      this.setState({
        date: new Date(year, month, day, hour, minute)
      });
      this.datePicked();
    }
  }

  onPressDate() {
    if (this.state.disabled) {
      return true;
    }

    // reset state
    this.setState({
      date: this.getDate(),
      dateChanged: false,
    });

    if (Platform.OS === 'ios') {
      this.setModalVisible(true);
    } else {

      // 选日期
      if (this.props.mode === 'date') {
        DatePickerAndroid.open({
          date: this.state.date,
          mode: 'spinner',
          minDate: this.props.minDate && this.getDate(this.props.minDate),
          maxDate: this.props.maxDate && this.getDate(this.props.maxDate)
        }).then(this.onDatePicked);
      } else if (this.props.mode === 'time') {
        // 选时间

        let timeMoment = Moment(this.state.date);

        TimePickerAndroid.open({
          hour: timeMoment.hour(),
          minute: timeMoment.minutes(),
          is24Hour: !this.format.match(/h|a/)
        }).then(this.onTimePicked);
      } else if (this.props.mode === 'datetime') {
        // 选日期和时间

        DatePickerAndroid.open({
          date: this.state.date,
          mode: 'spinner',
          minDate: this.props.minDate && this.getDate(this.props.minDate),
          maxDate: this.props.maxDate && this.getDate(this.props.maxDate)
        }).then(this.onDatetimePicked);
      } else {
        throw new Error('The specified mode is not supported');
      }
    }
  }

  render() {
    let customStyles = this.props.customStyles;
    this.format = this.props.format || FORMATS[this.props.mode];
    const dateInputStyle = [
      Style.dateInput, customStyles.dateInput,
      this.state.disabled && Style.disabled,
      this.state.disabled && customStyles.disabled
    ];

    return (
      <TouchableHighlight
        style={[Style.dateTouch, this.props.style]}
        underlayColor={'transparent'}
        onPress={this.onPressDate}
      >
        <View style={[Style.dateTouchBody, customStyles.dateTouchBody]}>
          <View style={dateInputStyle}>
            {this.getTitleElement()}
          </View>
          {this.props.showIcon && <Image
            style={[Style.dateIcon, customStyles.dateIcon]}
            source={this.props.iconSource}
          />}
          {Platform.OS === 'ios' && <Modal
            transparent={true}
            visible={this.state.modalVisible}
            onRequestClose={() => {this.setModalVisible(false);}}
          >
            <TouchableHighlight
              style={Style.datePickerMask}
              activeOpacity={1}
              underlayColor={'#00000077'}
            >
              <TouchableHighlight
                underlayColor={'#fff'}
                style={{flex: 1}}
              >
                <Animated.View
                  style={[Style.datePickerCon, {height: this.state.animatedHeight}, customStyles.datePickerCon]}
                >
                  <DatePickerIOS
                    date={this.state.date}
                    initialDate={this.props.initialDate}
                    mode={this.props.mode}
                    minimumDate={this.props.minDate && this.getDate(this.props.minDate)}
                    maximumDate={this.props.maxDate && this.getDate(this.props.maxDate)}
                    onDateChange={(date) => {
                      this.setState({date: date, dateChanged: true, invisibleBlocker: true})
                      timer.setTimeout(
                        this, 'disableInvisibleBLocker', () => {
                          this.setState({
                            invisibleBlocker: false,
                          });
                        }, 100
                      )
                    }}
                    style={[Style.datePicker, customStyles.datePicker]}
                  />

                  {!this.state.invisibleBlocker ||
                  <View style={{position: 'absolute', top: 0, left:0, height: 300, width: Dimensions.get('window').width}} />
                  }

                  <TouchableHighlight
                    underlayColor={'transparent'}
                    onPress={this.onPressCancel}
                    style={[Style.btnText, Style.btnCancel, customStyles.btnCancel]}
                  >
                    <Text
                      style={[Style.btnTextText, Style.btnTextCancel, customStyles.btnTextCancel]}
                    >
                      {this.props.cancelBtnText}
                    </Text>
                  </TouchableHighlight>
                  { !this.state.dateChanged ||
                  <TouchableHighlight
                    underlayColor={'transparent'}
                    onPress={this.onPressConfirm}
                    style={[Style.btnText, Style.btnConfirm, customStyles.btnConfirm]}
                  >
                    <Text style={[Style.btnTextText, customStyles.btnTextConfirm]}>{this.props.confirmBtnText}</Text>
                  </TouchableHighlight>
                  }
                </Animated.View>
              </TouchableHighlight>
            </TouchableHighlight>
          </Modal>}
        </View>
      </TouchableHighlight>
    );
  }
}

DatePicker.defaultProps = {
  mode: 'date',
  date: '',
  // component height: 216(DatePickerIOS) + 1(borderTop) + 42(marginTop), IOS only
  height: 259,

  // slide animation duration time, default to 300ms, IOS only
  duration: 300,
  confirmBtnText: '确定',
  cancelBtnText: '取消',
  iconSource: require('./date_icon.png'),
  customStyles: {},

  // whether or not show the icon
  showIcon: true,
  disabled: false,
  placeholder: '',
  modalOnResponderTerminationRequest: e => true
};

DatePicker.propTypes = {
  mode: React.PropTypes.oneOf(['date', 'datetime', 'time']),
  date: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.instanceOf(Date)]),
  minDate: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.instanceOf(Date)]),
  maxDate: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.instanceOf(Date)]),
  height: React.PropTypes.number,
  duration: React.PropTypes.number,
  confirmBtnText: React.PropTypes.string,
  cancelBtnText: React.PropTypes.string,
  iconSource: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.object]),
  customStyles: React.PropTypes.object,
  showIcon: React.PropTypes.bool,
  disabled: React.PropTypes.bool,
  onDateChange: React.PropTypes.func,
  placeholder: React.PropTypes.string,
  modalOnResponderTerminationRequest: React.PropTypes.func
};

export default DatePicker;
