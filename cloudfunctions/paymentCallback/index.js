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

        // 获取店铺设置，检查是否开启自动接单
        let autoAcceptOrder = false
        try {
          const shopRes = await db.collection('shopInfo').limit(1).get()
          if (shopRes.data.length > 0) {
            autoAcceptOrder = shopRes.data[0].autoAcceptOrder === true
          }
        } catch (err) {
          console.error('获取店铺设置失败', err)
        }

        // 自动接单：状态直接变为 2（制作中）
        // 手动接单：状态变为 1（待接单）
        const newStatus = autoAcceptOrder ? 2 : 1

        await db.collection('orders').doc(order._id).update({
          data: {
            status: newStatus,
            transactionId,
            payTime: new Date().getTime(),
            updateTime: new Date().getTime(),
            autoAccepted: autoAcceptOrder
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