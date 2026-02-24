const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { returnCode, returnMsg, transactionId, outTradeNo, timeEnd, totalFee } = event

  if (returnCode === 'SUCCESS' && returnMsg === 'OK') {
    try {
      const orderRes = await db.collection('orders').where({
        orderNo: outTradeNo
      }).get()

      if (orderRes.data.length > 0) {
        const order = orderRes.data[0]
        
        await db.collection('orders').doc(order._id).update({
          data: {
            status: 1,
            transactionId,
            payTime: new Date().getTime(),
            updateTime: new Date().getTime()
          }
        })
      }

      return {
        errcode: 0,
        errmsg: 'SUCCESS'
      }
    } catch (err) {
      console.error('支付回调处理失败', err)
      return {
        errcode: -1,
        errmsg: '处理失败'
      }
    }
  }

  return {
    errcode: -1,
    errmsg: '支付失败'
  }
}