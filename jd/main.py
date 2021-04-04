#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time : 2021/3/13 23:38
# @Author : Losenine
# software: PyCharm

import base64
import binascii
import hashlib


def get_sign(hex_str):
    # functionId=uniformRecommend&body=12345678&uuid=-404e361f61df&client=android&clientVersion=9.2.2&st=1615648708742&sv=111
    base64_encoded = base64.b64encode(binascii.unhexlify(hex_str))
    return hashlib.md5(base64_encoded).hexdigest()


# functionId=uniformRecommend&body=12345678&uuid=-404e361f61df&client=android&clientVersion=9.2.2&st=1615648708742&sv=111
# hex_str = "afcb2afb1f349bed06555aed7cd37909bbc31efd062a99ec225f8d9e70d17f036687fe8bdff062b6f51792ed47ce14f77d86f0fdd6f16de5f3228dde34c54733aefc3095042990f1245a8d9e71d6400f97ca12fd153ea5ee2b2e46a6009005c0bccaf989d9fc61b5f1295ca816990fdc6fc13295d4fc6d"
# print(get_sign(hex_str))
# call_sign result: st=1615648708742&sign=05f104857bcd1dc8b817cfd440748390&sv=111

def padding_hex(hex):
    return "0" * (4 - len(str(hex))) + str(hex).replace('0x', '')


def calc_sign(input):
    result = ''
    arg0 = "80306f4370b39fd5630ad0529f77adb6"
    key = [ 0x37, 0x92, 0x44, 0x68, 0xA5, 0x3D, 0xCC, 0x7F, 0xBB, 0x0F, 0xD9, 0x88, 0xEE, 0x9A, 0xE9, 0x5A]
    for i in range(0, len(input)):
        R0 = ord(input[i]) & 255
        R2 = key[i & 15]
        arg0_index = i & 7
        R4 = ord(arg0[arg0_index]) & 255
        R0 = R2 ^ R0
        R0 = R0 ^ R4
        tmp_R0 = R0 + R2
        tmp_R2 = R2 ^ tmp_R0
        R2 = 255 & tmp_R2
        R1 = ord(arg0[arg0_index]) & 255
        R2 = R2 ^ R1
        result += padding_hex(hex(R2))
    return result

    # print(result)
    # print(get_sign(result))


if __name__ == '__main__':
    input = "functionId=uniformRecommend&body=12345678&uuid=-404e361f61df&client=android&clientVersion=9.2.2&st=1615648708742&sv=111"
    sign = get_sign(calc_sign(input))
    print(sign)
