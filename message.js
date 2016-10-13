/**
 * @Author: MinJun Kweon <minjunkweon>
 * @Date:   2016-07-19T05:00:23+09:00
 * @Email:  Minz0000000@gmail.com
 * @Last modified by:   kweonminjun
 * @Last modified time: 2016-07-29T23:00:18+09:00
 */

const message = [
  'success',  // 0
  'failed to connect DB', // 1
  'already exists', // 2
  'invalid parameter',  // 3
  'Permission Denied',  // 4
  'No user. Please check your account.',  // 5
  'No glucose object. Please check \'glucoseId\'',  // 6
  'No food index', // 7
  'No walk step data', // 8
  'No sports data', // 9
  'Everything up-to-date', // 10
  'User is waiting for creating group', // 11
  'User isn\'t queueing.', // 12
];

const code = [
  200,
  500,
  200,
  200,
  403,
  200,
  200,
  200,
  200,
  200,
  210,
  211,
  212,
];

exports.code = function (num) {
  return code[num];
};

exports.json = function (num, err) {
  const json = { code: num, message: message[num] };
  if (num == 1)
    json.err = err;
  return json;
};
