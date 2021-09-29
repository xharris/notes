import React from 'react'
import { render } from 'preact'
import { App } from 'component/app'
// import "./manifest.webmanifest"

window.addEventListener('DOMContentLoaded', () => {
  render(<App />, document.body)
})

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
  // window.addEventListener("load", () => {
  //   navigator.serviceWorker
  //     .register("service-worker.js")
  //     .then((reg) => {
  //       reg.update()
  //       console.log(`SW registered: ${reg}`)
  //     })
  //     .catch((err) => {
  //       console.log(`SW registration failed: ${err}`)
  //     })
  // })
}
