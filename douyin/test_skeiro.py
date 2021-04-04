#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time : 2021/3/30 14:45
# @Author : Losenine
# software: PyCharm
import requests

params = {
        'group':  'douyin',
        'action': 'x-gorgon',
        'url':    'user_id=64788143060&sec_user_id=MS4wLjABAAAAGvN5h5ViVqhDE2uQUtoVyv0Khik5j1tvPEL7APR0fKs&max_time=1605276367&count=20&offset=0&source_type=1&address_book_access=2&gps_access=1&vcd_count=0&ts=1605276368&host_abi=armeabi-v7a&_rticket=1605276368043&',
        'cookie': ''
}
response = requests.get('http://81.70.160.147:5601/asyncInvoke', params = params, verify = False, timeout = 60)

print(response.json())
