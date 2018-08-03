import os,sys
sys.path.append("/opt/airbender/lib")
from airbender import *
from livdatdatastream import *
from ftplib import FTP, error_perm
def placeFiles(ftp, path,logger):
    for name in os.listdir(path):
        localpath = os.path.join(path, name)
        if os.path.isfile(localpath):
            logger.info("STOR " + name +" " + localpath)
            ftp.storbinary('STOR ' + name, open(localpath,'rb'))
        elif os.path.isdir(localpath):
            logger.info("MKD " + name)

            try:
                ftp.mkd(name)

            # ignore "directory already exists"
            except error_perm as e:
                if not e.args[0].startswith('550'): 
                    raise

            logger.info("CWD " + name)
            ftp.cwd(name)
            placeFiles(ftp, localpath,logger)           
            logger.info("CWD " + "..")
            ftp.cwd("..")

host="103.21.58.231"
port=21



a=AirBender(sys.argv[1])
#a.airveda_login()
#	time.sleep(10)
'''
while True:
	a.driver.close()
	a.driver=a.get_driver()
	a.airveda_login()
	a.logger.info("Starting update....")
	a.reload_devdf()
	for dev in a.devdf.devname:
		a.update_device(dev)
	ftp=FTP()
	ftp.connect(host,port)
	ftp.login("airbender@environicsindia.in","A1rbender!")
	placeFiles(ftp,"/media/usb/airbenderdata/streamdata/",a.logger)
	time.sleep(1200)


#airvedafiles=a.airveda_update()
#thingspeakfiles=a.thingspeak_update()
'''
