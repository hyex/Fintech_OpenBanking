# -*- coding: utf-8 -*-
from selenium import webdriver
print("D")
# driver = webdriver.Chrome('/Users/kimhyeji/Desktop/paymentKisa/scraping/chromedriver')
driver = webdriver.Chrome('scraping/chromedriver')
driver.implicitly_wait(3)
driver.get('https://biz.chosun.com/site/data/html_dir/2020/02/07/2020020702037.html')
