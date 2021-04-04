import requests

headers = {
    'x-sgext': 'JAGVB%2BMgfOtF9HDB5xhJSAekN6QzpCSkPqMxoySkJLY2ozajMaMzrDOn',
    'x-bx-version': '6.5.24',
    'f-refer': 'mtop',
    'x-extdata': 'openappkey%3DDEFAULT_AUTH',
    'x-app-ver': '6.9.30',
    'x-sign': 'azU7Bc002xAAKIwjKIN3%2FrZMVakMOIwois0Z7ouKd%2BCfGaYgNbXrLAOzgd7YkMe4ZUq3uzLvu%2F7%2FKkhU3BHIfC1sLbiMOIwojDiMKI',
    'x-c-traceid': 'YDNW07NHhDoDALvY76Xewc3Y16166649430050004119666',  #  x-utdid  +ts+
    'x-pv': '6.3',
    'EagleEye-UserData': 'spm-cnt=a2170.7897990.0.0&spm-url=a2170.unknown.0.0',
    'x-features': '27',
    'x-app-conf-v': '0',
    'x-umt': 'YDNW07NHhDoDALvY76Xewc3Y',
    'a-orange-q': 'appKey=21407387&appVersion=6.9.30&clientAppIndexVersion=0&clientVersionIndexVersion=0',
    'x-mini-wua': 'HHnB_6taVbJUmfdeU4yOBtFkWB2fQvK4fWATHtGhWDrrcpC4%3D',
    'x-utdid': 'YDNW07NHhDoDALvY76Xewc3Y',
    'x-appkey': '21407387',
    'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
    'cache-control': 'no-cache',
    'x-t': '1616664943',
    'user-agent': 'MTOPSDK%2F3.1.1.7+%28Android%3B8.1.0%3BGoogle%3BPixel+XL%29',
    'Host': 'acs.m.taobao.com',
}

params = (
    ('data', '{"new_device":"true","c4":"","c5":"unknown","c6":"6774af70b76426f1","device_global_id":"YDNW07NHhDoDALvY76Xewc3Y","c0":"google","c1":"Pixel XL"}'),
)

response = requests.get('https://acs.m.taobao.com/gw/mtop.sys.newdeviceid/4.0/', headers=headers, params=params)

print(response.json())
