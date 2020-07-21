# -*- coding: utf-8 -*-
from selenium import webdriver
import datetime
driver = webdriver.Chrome('./chromedriver')
driver.implicitly_wait(3)
driver.get('https://www.alimi.or.kr/api/a/vacant/selectApiVacant.do')
driver.implicitly_wait(3)
for z in range(0,2):
    for i in range(4,14):
        productTable = driver.find_element_by_class_name('search_list').find_element_by_tag_name('tbody')
        rows = productTable.find_elements_by_tag_name("tr")
        for index, value in enumerate(rows):
        # Get the columns (all the column 2)
            if index != 0:
                type =  value.find_elements_by_tag_name('td')[1].text
                myDatetime = datetime.datetime.strptime(type, '%Y.%m.%d')
                address = value.find_elements_by_tag_name('td')[2].text
                pay = value.find_elements_by_tag_name('td')[3].text
                size = value.find_elements_by_tag_name('td')[4].text
                jimk = value.find_elements_by_tag_name('td')[5].text
                print(type, myDatetime, address, pay, size, jimk)
        element = driver.find_element_by_xpath('//*[@id="list"]/tbody/tr[4]/td/ul/a['+str(i)+']');
        driver.execute_script("arguments[0].click();", element)
