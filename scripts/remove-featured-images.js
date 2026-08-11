// remove-featured-images.js
// Removes featured images from existing blog posts and deletes the media items
// Run: node scripts/remove-featured-images.js
// Requires: PROXY_URL, PROXY_SECRET, LABLAB_WP_USER, LABLAB_WP_APP_PASSWORD (or uses defaults)

var fetch = require('node-fetch')

var WP_URL = process.env.LABLAB_WP_URL || 'https://www.lablab.cl'
var WP_USER = process.env.LABLAB_WP_USER || 'contacto@mulleryperez.cl'
var WP_PASS = process.env.LABLAB_WP_APP_PASSWORD || 'MDEa VKWZ oxha c3uC sX2x RiKr'
var PROXY_URL = process.env.PROXY_URL || 'https://lablab-seo.vercel.app'
var PROXY_SECRET = process.env.PROXY_SECRET || '47a241bca1ede34ffef5848043c7a7bd'

var AUTH = 'Basic ' + Buffer.from(WP_USER + ':' + WP_PASS).toString('base64')
var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

var POST_IDS = [9180, 9173, 9171, 9169, 9163, 9161, 9159, 9148, 9143, 9140, 9138, 9134, 9129, 9127]
var MEDIA_IDS = [9179, 9172, 9170, 9168, 9162, 9160, 9158, 9147, 9142, 9139, 9137, 9133, 9128, 9126]

async function wpFetch(path, opts) {
  var url = PROXY_URL + '/api/wp-proxy'
  opts = opts || {}
  opts.headers = opts.headers || {}
  opts.headers['X-WP-Path'] = path
  opts.headers['X-Proxy-Secret'] = PROXY_SECRET
  opts.headers['Authorization'] = AUTH
  opts.headers['User-Agent'] = UA
  if (opts.body && typeof opts.body === 'object') {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(opts.body)
  }
  var r = await fetch(url, opts)
  return r
}

async function main() {
  console.log('=== Removing featured images from LabLab blog posts ===\n')

  // Step 1: Remove featured_media from posts
  console.log('--- Step 1: Setting featured_media=0 on posts ---')
  for (var i = 0; i < POST_IDS.length; i++) {
    var pid = POST_IDS[i]
    try {
      var r = await wpFetch('/wp-json/wp/v2/posts/' + pid, {
        method: 'POST',
        body: { featured_media: 0 }
      })
      var data = await r.json()
      if (data.id) {
        console.log('  OK post ' + pid + ': featured_media=' + data.featured_media + ' title="' + (data.title && data.title.rendered || '').substring(0, 50) + '"')
      } else {
        console.log('  WARN post ' + pid + ': ' + JSON.stringify(data).substring(0, 150))
      }
    } catch (e) {
      console.log('  ERROR post ' + pid + ': ' + e.message)
    }
  }

  // Step 2: Delete media items
  console.log('\n--- Step 2: Deleting media items ---')
  for (var j = 0; j < MEDIA_IDS.length; j++) {
    var mid = MEDIA_IDS[j]
    try {
      var r2 = await wpFetch('/wp-json/wp/v2/media/' + mid + '?force=true', {
        method: 'DELETE'
      })
      var data2 = await r2.json()
      if (data2.deleted || data2.id) {
        console.log('  OK media ' + mid + ' deleted')
      } else {
        console.log('  WARN media ' + mid + ': ' + JSON.stringify(data2).substring(0, 150))
      }
    } catch (e) {
      console.log('  ERROR media ' + mid + ': ' + e.message)
    }
  }

  console.log('\nDone!')
}

main().catch(function (e) { console.error('Fatal:', e.message); process.exit(1) })
