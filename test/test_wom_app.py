from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import time
import psutil
import sys

name = "livestream1"
rtsp = "rtsp://172.16.66.3/id=1"
testUrl = "http://localhost:8081"

browsers = []

def setUp():
  createLiveStream()

def startBrowser():
    desired_capabilities = DesiredCapabilities.CHROME.copy()
    desired_capabilities['chromeOptions'] = {
        "args": ["--flag-switches-begin","--disable-gpu","--disable-software-rasterizer","--disable-accelerated-video-decode","--disable-webrtc-hw-encoding","--start-maximized", "--flag-switches-end"]
    }
    browser = webdriver.Chrome(desired_capabilities=desired_capabilities)
    browser.get(testUrl)
    browsers.append(browser)
    return browser

def createLiveStream():
    browser = startBrowser()
    browser.find_element_by_id('sessionSelector').find_element_by_xpath("//option[@value='0']").click()
    browser.find_element_by_tag_name('input').send_keys(name)
    createBtn = browser.find_element_by_class_name('clickbutton')
    createBtn.send_keys(Keys.RETURN)
    time.sleep(1)

    addLiveStreamAudience(browser)


def addLiveStreamAudience(browser):
    browser.find_element_by_tag_name('button').click()
    time.sleep(1)
    browser.find_element_by_tag_name('input').send_keys(name)

    browser.find_element_by_id('protocolSelector').find_element_by_xpath("//option[@value='1']").click()

    time.sleep(1)

    browser.find_element_by_id('callerSelector').find_element_by_xpath("//option[@value='1']").click()

    time.sleep(1)

    browser.find_element_by_id('videoToSend').click()
    browser.find_element_by_id('audioToSend').click()

    browser.find_element_by_id('audioToReceive').click()
    browser.find_element_by_id('videoToReceive').click()


    createBtn = browser.find_element_by_class_name('clickbutton')
    createBtn.send_keys(Keys.RETURN)


def testAddDeleteViewerAlternately():
    return

def tearDown():
    return
    for browser in browsers:
        browser.close()


