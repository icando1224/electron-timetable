const {remote} = require('electron')
const app = remote.app
const $ = require('jquery')
const fs = require('fs')
const dialog = remote.dialog

const win = remote.getCurrentWindow()

let canDelete = false
let canEdit = false
let hideWeeks = false
let hideBackground = false

let data2 = {Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []}
let readDays = {}
let readDaysWrite = {}

let weeks = []

let currentWeekIndex
let clickedId

let bgInterval
let bgData = {changeTime:'',background:''}

let timer
$('#bgSec').keyup(()=>{
  if (isNaN($('#bgSec').val()) || $('#bgSec').val().includes('.')) {
    $('#bgSec').val('')
    return
  }
  clearTimeout(timer)
  timer = setTimeout(function() {
    if ($('#bgSec').val() > 10000 || ($('#bgSec').val() < 5 && $('#bgSec').val() != 0)) {
      $('#bgSec').val('')
      $('.error').html('Minimum change time is 5 seconds or 0 seconds')
      $('.error').animate({'opacity':'1'},400)
      return
    }
  }, 500)
})

$(document).ready(()=>{
  for (let i=1;i<=24;i++) {
    $('.addLessonOverlay #start_time_h').append('<option value='+i+'>'+i+'</option>')
  }
  for(let i=0;i<60;i++) {
    if (i<10) {
      $('.addLessonOverlay #start_time_mm').append('<option value=0'+i+'>0'+i+'</option>')
    }
    if (i>=10) {
      $('.addLessonOverlay #start_time_mm').append('<option value='+i+'>'+i+'</option>')
    }
  }
  for (let i=1;i<=24;i++) {
    $('.addLessonOverlay #finish_time_h').append('<option value='+i+'>'+i+'</option>')
  }
  for (let i=0;i<60;i++) {
    if (i<10) {
      $('.addLessonOverlay #finish_time_mm').append('<option value=0'+i+'>0'+i+'</option>')
    }
    if (i>=10) {
      $('.addLessonOverlay #finish_time_mm').append('<option value='+i+'>'+i+'</option>')
    }
  }
  for (let i=1;i<=24;i++) {
    $('.editLessonOverlay #start_time_h').append('<option value='+i+'>'+i+'</option>')
  }
  for(let i=0;i<60;i++) {
    if (i<10) {
      $('.editLessonOverlay #start_time_mm').append('<option value=0'+i+'>0'+i+'</option>')
    }
    if (i>=10) {
      $('.editLessonOverlay #start_time_mm').append('<option value='+i+'>'+i+'</option>')
    }
  }
  for (let i=1;i<=24;i++) {
    $('.editLessonOverlay #finish_time_h').append('<option value='+i+'>'+i+'</option>')
  }
  for (let i=0;i<60;i++) {
    if (i<10) {
      $('.editLessonOverlay #finish_time_mm').append('<option value=0'+i+'>0'+i+'</option>')
    }
    if (i>=10) {
      $('.editLessonOverlay #finish_time_mm').append('<option value='+i+'>'+i+'</option>')
    }
  }
});

////////////////////////////////////////////////////////////////////////////////
/////////////////////////        CLICK EVENTS         //////////////////////////
////////////////////////////////////////////////////////////////////////////////

$('.exitBTN').on('click', () => {
  app.quit()
})

$('.minimizeBTN').on('click', () => {
  win.minimize()
})

$('.deleteBTN').on('click', function () {
  canDelete = !canDelete
  if (canDelete) {
    $('.lesson .deleteItem').css('display', 'block')
    $('.lesson .editItem').css('display', 'none')
    canEdit = false

    $('i', this).css('color', '#00FF88')
    $('.editBTN i').css('color', 'white')
  }
  if (!canDelete) {
    $('.lesson .deleteItem').css('display', 'none')

    $('i', this).css('color', 'white')
  }
})
$('.editBTN').on('click', function () {
  canEdit = !canEdit
  if (canEdit) {
    $('.lesson .deleteItem').css('display', 'none')
    $('.lesson .editItem').css('display', 'block')
    canDelete = false

    $('i', this).css('color', '#00FF88')
    $('.deleteBTN i').css('color', 'white')
  }
  if (!canEdit) {
    $('.lesson .editItem').css('display', 'none')

    $('i',this).css('color', 'white')
  }
})

$('.changeWeekBTN').on('click', () => {
  hideWeeks = !hideWeeks
  if (hideWeeks) {
    $('#weeks').css('display', 'block')
  } else {
    $('#weeks').css('display', 'none')
  }
})

$('body').on('click', '#weeks li', () => {
  hideWeeks = !hideWeeks
  $('#weeks').css('display', 'none')
})

$(document).on('keyup',function(evt) {
  if (evt.keyCode == 27) {
    $('.addLessonOverlay .innerBox #exitOverlay').click()
    $('.editLessonOverlay .innerBox #exitOverlay').click()
    $('.setBGOverlay .innerBox #exitOverlay').click()
    $('.importexportOverlay .innerBox #exitOverlay').click()
  }
})

$('.addLessonOverlay .innerBox #exitOverlay').on('click', function () {
  $('.addLessonOverlay').animate({
    'opacity': '0'
  }, 400)
  setTimeout(function () {
    $('.addLessonOverlay').css('display', 'none')
  }, 400)
})


$('.editLessonOverlay .innerBox #exitOverlay').on('click', function () {
  $('.editLessonOverlay').animate({
    'opacity': '0'
  }, 400)
  setTimeout(function () {
    $('.editLessonOverlay').css('display', 'none')
  }, 400)
})

$('.importexportOverlay .innerBox #exitOverlay').on('click', function () {
  $('.importexportOverlay').animate({
    'opacity': '0'
  }, 400)
  setTimeout(function () {
    $('.importexportOverlay').css('display', 'none')
  }, 400)
})

$('.bgBTN').on('click', ()=>{
  hideBackground = !hideBackground
  if (hideBackground) {
    $('.setBGOverlay').css('display','block')
    $('.setBGOverlay').animate({
      'opacity': '1'
    }, 400)
  } else {
    $('.setBGOverlay').animate({
      'opacity': '0'
    }, 400)

    setTimeout(function () {
      $('.setBGOverlay').css('display', 'none')
    }, 400)
  }
})

$('.setBGOverlay .innerBox #exitOverlay').on('click',function () {

  $('.setBGOverlay').animate({
    'opacity': '0'
  }, 400)
  setTimeout(function () {
    $('.setBGOverlay').css('display', 'none')
  }, 400)

  hideBackground = false
})

$('.addBG').on('click',function() {
  $('#bgSec').css('border','1px solid white')
  $('.error').css('opacity','0')
  if ($('#bgSec').val().includes('.') || isNaN($('#bgSec').val()) || (parseInt($('#bgSec').val()) < 5 && parseInt($('#bgSec').val()) !== 0)) {
    $('#bgSec').css('border','1px solid #DB2B39');
    return
  }
  if($('.staticColor').val().length === 0) {
    let newContent = {changeTime:$('#bgSec').val(),background:''}
    fs.writeFile(app.getPath('userData')+'/background_settings.json',JSON.stringify(newContent),(e)=>{
    })
  }
  if(parseInt($('#bgSec').val()) < 5 && parseInt($('#bgSec').val()) != 0 || parseInt($('#bgSec').val()) > 10000) return
  if ($('#bgFile').val().length > 0) {

    let fileName = document.getElementsByTagName('input')[0].files[0].path
    let length = fileName.length-1
    let extension = ''
    for (let i=0;i<fileName.length;i++) {
      if (fileName[length] === '.') break
      extension += fileName[length]
      length -= 1
    }
    let extLength = extension.length-1
    let reversedExtension = ''
    for (let i=0;i<extension.length;i++) {
      reversedExtension += extension[extLength]
      extLength-=1
    }

    if (reversedExtension === 'png' ||  reversedExtension === 'PNG' || reversedExtension === 'svg' || reversedExtension === 'SVG' || reversedExtension === 'jpg' || reversedExtension === 'JPG' || reversedExtension === 'gif' || reversedExtension === 'GIF' || reversedExtension === 'jpeg' || reversedExtension === 'JPEG' || reversedExtension === 'JFIF' || reversedExtension === 'jfif') {

      let splittedFileName = fileName.split('\\')
      let getName = splittedFileName[splittedFileName.length-1].split('.')

      fs.createReadStream(fileName).pipe(fs.createWriteStream(app.getPath('userData')+'/images/'+getName[0]+'.'+getName[1]))

        let cfileName = getName[0]+'.'+getName[1]

        let newData = {changeTime:$('#bgSec').val(),background:cfileName}

        fs.writeFile(app.getPath('userData')+'/background_settings.json',JSON.stringify(newData),(e)=>{
        })
        clearInterval(bgInterval)
        $('.staticColor').val(cfileName)


    } else {
      $('.setBGOverlay .error').animate({'opacity':'1'},400)
      $('.setBGOverlay .error').html('Invalid File Format<br>(Supported: PNG,SVG,JPG,GIF,JPEG,JFIF)')
      return
    }

  }
  else {
    let newContent2 = {changeTime:$('#bgSec').val(),background:$('.staticColor').val()}
    fs.writeFile(app.getPath('userData')+'/background_settings.json',JSON.stringify(newContent2),(e)=>{
    })
  }

  $('.setBGOverlay').animate({
    'opacity': '0'
  }, 400)
  setTimeout(function () {
    $('.setBGOverlay').css('display', 'none')
  }, 400)

  hideBackground = false

  $('#bgFile').val('')

  readData()
})
////////////////////////////////////////////////////////////////////////////////
/////////////////////////     ADD ELEMENTS TO ARRAY   //////////////////////////
////////////////////////////////////////////////////////////////////////////////


function add3 (key, value) {
  if (!Array.isArray(readDaysWrite[key])) {
    readDaysWrite[key] = [readDaysWrite[key]]
  }
  readDaysWrite[key].push(value)
}

////////////////////////////////////////////////////////////////////////////////
///////////////////////       READ DATA FUNCTION        ////////////////////////
////////////////////////////////////////////////////////////////////////////////

function readData () {

  let fileNames = []
  let fileIndex = 0
  let readBGSettings = {}
  let location = app.getPath('userData')
  let newloc = ""
  for (let i=0;i<location.length;i++) {
    if (location[i] == '\\') {
      newloc += '/'
    } else {
      newloc += location[i]
    }
  }

  if(!fs.existsSync(app.getPath('userData')+'/images')){
    fs.mkdirSync(app.getPath('userData')+'/images')
  }

  if(!fs.existsSync(app.getPath('userData')+'/background_settings.json'))
    fs.writeFile(app.getPath('userData')+'/background_settings.json',JSON.stringify(bgData),(e)=>{
  })

  clearInterval(bgInterval)

  fs.readFile(app.getPath('userData')+'/background_settings.json','utf-8',(err,data)=>{
    if (err) throw new Error('error')
    try{
      readBGSettings = JSON.parse(data)

    if(readBGSettings.changeTime === ''){
      $('.bg').css('background','url("'+newloc+'/images/'+readBGSettings.background+'")')
      $('.bg').css('background-size','cover')
      $('.bg').css('background-repeat','no-repeat')
    }
    if(readBGSettings.changeTime < 5 && readBGSettings.changeTime != 0)
      readBGSettings.changeTime = 0


    $('.staticColor').val(readBGSettings.background)
    $('#bgSec').val(readBGSettings.changeTime)

    if (readBGSettings.changeTime !== '' && parseInt(readBGSettings.changeTime) === 0 && (readBGSettings.background.includes('.png') || readBGSettings.background.includes('.gif') || readBGSettings.background.includes('.svg') || readBGSettings.background.includes('.jpg') || readBGSettings.background.includes('.jpeg') || readBGSettings.background.includes('.jfif'))) {
      $('.bg').css('background','url("'+newloc+'/images/'+readBGSettings.background+'")')

      $('.bg').css('background-size','cover')
      $('.bg').css('background-repeat','no-repeat')
    }

    if (readBGSettings.changeTime !== '' && parseInt(readBGSettings.changeTime) > 0 && (readBGSettings.background.length === 0 || readBGSettings.background.includes('.png') || readBGSettings.background.includes('.gif') || readBGSettings.background.includes('.svg') || readBGSettings.background.includes('.jpg') || readBGSettings.background.includes('.jpeg') || readBGSettings.background.includes('.jfif'))) {
      fs.readdir(newloc+'/images/',(err,files)=>{
        if (err) throw new Error('error')

        if(files.length > 1) {
          for (let i=0;i<files.length;i++) {
            let length = files[i].length-1
            let reversedExtension = ''
            for (let j=0;j<files[i].length;j++) {
              if(files[i][length] === '.') break
              reversedExtension += files[i][length]
              length -= 1
            }
            let extLength = reversedExtension.length-1
            let finalExtension = ''
            for (let j=0;j<reversedExtension.length;j++) {
              finalExtension += reversedExtension[extLength]
              extLength -= 1
            }
            if (finalExtension === 'png' || finalExtension === 'PNG' || finalExtension === 'svg' || finalExtension === 'SVG' || finalExtension === 'jpg' || finalExtension === 'JPG' || finalExtension === 'gif' || finalExtension === 'GIF' || finalExtension === 'jpeg' || finalExtension === 'JPEG' || finalExtension === 'JFIF' || finalExtension === 'jfif' ) {
              fileNames.push(files[i])
            }
          }

          fs.readFile(app.getPath('userData')+'/background_settings.json','utf-8',(err,data)=>{
              if(err) throw new Error('error')

              try{
                let parsedData = JSON.parse(data)

                if (parsedData.changeTime !== null) {

                  let changeTime = parseInt(parsedData.changeTime)*1000

                    bgInterval = setInterval(()=>{
                      $('.bg').animate({'opacity':'0'},1000)
                      setTimeout(()=>{
                        $('.bg').css('background','url("'+newloc+'/images/'+fileNames[fileIndex]+'")')
                        $('.bg').css('background-size','cover')
                        $('.bg').css('background-repeat','no-repeat')
                        $('.bg').animate({'opacity':'1'},1000)
                      },1000)
                      if(fileNames.length > fileIndex+1) {
                        fileIndex += 1
                      }
                      else {
                        fileIndex = 0
                      }
                    },changeTime)
                }

              }catch(e){
                fs.writeFile(app.getPath('userData')+'/background_settings.json',JSON.stringify(bgData),(e)=>{
                })
              }

              })

        }

        if (fileNames.length > 0) {
          $('.bg').css('background','url("'+newloc+'/images/'+fileNames[0]+'")')
          $('.bg').css('background-size','cover')
          $('.bg').css('background-repeat','no-repeat')
          fileIndex += 0;
        }
      })
    }
    else {
      $('.bg').css('background',readBGSettings.background)
      $('.bg').css('background-size','cover')
      $('.bg').css('background-repeat','no-repeat')
    }
  } catch(e) {

      fs.writeFile(app.getPath('userData')+'/background_settings.json',JSON.stringify(bgData),(e)=>{
      })
    }
    })

  //////////////////////////////////////////////////////////////////////////////
  /////////////////////           LOAD LESSONS        //////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  readDays = {}
  readDaysWrite = {}
  weeks = []
  $('#weeks').empty()
  $('.innerContainer').empty()

  if (!fs.existsSync(app.getPath('userData') + '/settings.json')) {
    fs.writeFile(app.getPath('userData') + '/settings.json', JSON.stringify(data2), (e) => {
    })
  }

  fs.readFile(app.getPath('userData') + '/settings.json', 'utf-8', (err, data) => {
    if (err) throw new Error('error')

    if (data.length === 0) {
      fs.writeFile(app.getPath('userData') + '/settings.json', JSON.stringify(data2), (e) => {
      })
      return;
    }

    let sortTimesMonday = []
    let sortTimesTuesday = []
    let sortTimesWednesday = []
    let sortTimesThursday = []
    let sortTimesFriday = []
    let sortTimesSaturday = []
    let sortTimesSunday = []

    try{
      readDays = JSON.parse(data)
      readDaysWrite = JSON.parse(data)
    } catch (e) {
      fs.writeFile(app.getPath('userData') + '/settings.json', JSON.stringify(data2), (e) => {
      })
      return;
    }


    for (let i = 0; i < Object.keys(readDaysWrite).length; i++) {
      for (let j = 0; j < readDaysWrite[Object.keys(readDaysWrite)[i]].length; j++) {
        if ($.inArray(readDaysWrite[Object.keys(readDaysWrite)[i]][j].week, weeks) === -1) {
          weeks.push(readDaysWrite[Object.keys(readDaysWrite)[i]][j].week)
        }
      }
    }

    for (let i = 0; i < weeks.length; i++) {
      $('#weeks').append('<li id="' + weeks[i] + '">Week ' + weeks[i] + '</li>')
      $('.innerContainer').append('<div class="week" id=week' + weeks[i] + '><div class="day" id="monday"></div><div class="day" id="tuesday"></div><div class="day" id="wednesday"></div><div class="day" id="thursday"></div><div class="day" id="friday"></div><div class="day" id="saturday"></div><div class="day" id="sunday"></div></div>')
    }


    for (let i = 0; i < Object.keys(readDays).length; i++) {
      $('#' + Object.keys(readDays)[i].toLowerCase()).empty()
    }


    for (let i = 0; i < Object.keys(readDays).length; i++) {
      if (Object.keys(readDays)[i] === 'Monday') {
        for (let j = 0; j < readDays[Object.keys(readDays)[i]].length; j++) {
          sortTimesMonday.push(readDays[Object.keys(readDays)[i]][j].start_time)
        }
      }
      if (Object.keys(readDays)[i] === 'Tuesday') {
        for (let j = 0; j < readDays[Object.keys(readDays)[i]].length; j++) {
          sortTimesTuesday.push(readDays[Object.keys(readDays)[i]][j].start_time)
        }
      }
      if (Object.keys(readDays)[i] === 'Wednesday') {
        for (let j = 0; j < readDays[Object.keys(readDays)[i]].length; j++) {
          sortTimesWednesday.push(readDays[Object.keys(readDays)[i]][j].start_time)
        }
      }
      if (Object.keys(readDays)[i] === 'Thursday') {
        for (let j = 0; j < readDays[Object.keys(readDays)[i]].length; j++) {
          sortTimesThursday.push(readDays[Object.keys(readDays)[i]][j].start_time)
        }
      }
      if (Object.keys(readDays)[i] === 'Friday') {
        for (let j = 0; j < readDays[Object.keys(readDays)[i]].length; j++) {
          sortTimesFriday.push(readDays[Object.keys(readDays)[i]][j].start_time)
        }
      }
      if (Object.keys(readDays)[i] === 'Saturday') {
        for (let j = 0; j < readDays[Object.keys(readDays)[i]].length; j++) {
          sortTimesSaturday.push(readDays[Object.keys(readDays)[i]][j].start_time)
        }
      }
      if (Object.keys(readDays)[i] === 'Sunday') {
        for (let j = 0; j < readDays[Object.keys(readDays)[i]].length; j++) {
          sortTimesSunday.push(readDays[Object.keys(readDays)[i]][j].start_time)
        }
      }
    }

    sortTimesMonday.sort(CustomSort)
    sortTimesTuesday.sort(CustomSort)
    sortTimesWednesday.sort(CustomSort)
    sortTimesThursday.sort(CustomSort)
    sortTimesFriday.sort(CustomSort)
    sortTimesSaturday.sort(CustomSort)
    sortTimesSunday.sort(CustomSort)

    function CustomSort (a, b) {
      let split = a.split(':')
      let split2 = b.split(':')
      if (split[0] !== split2[0]) {
        return (split[0] - split2[0])
      } else {
        return (split[1].localeCompare(split2[1]))
      }
    }


    for (let i = 0; i < sortTimesMonday.length; i++) {
      for (let k = 0; k < readDays['Monday'].length; k++) {
        if (sortTimesMonday[i] === readDays['Monday'][k].start_time) {
          for (let j = 0; j < weeks.length; j++) {
            if (weeks[j] === readDays['Monday'][k].week) {
              $('#week' + weeks[j] + ' #monday').append('<div class="lesson"><div class="sideColor" style="background:' + readDays['Monday'][k].bgColor + '"></div><i id="Monday-' + k + '" class="icon-garbage deleteItem"></i><i id="Monday-' + k + '" class="icon-edit editItem"></i><p id="time">' + readDays['Monday'][k].start_time + '-' + readDays['Monday'][k].finish_time + '</p><p id="className">' + readDays['Monday'][k].lesson_name + '</p><p id="teacherName">' + readDays['Monday'][k].teacher_name + '</p><p id="classRoom">' + readDays['Monday'][k].class_room + '</p></div>')
              delete readDays['Monday'][k].start_time
              break
            }
          }
        }
      }
    }
    for (let i = 0; i < sortTimesTuesday.length; i++) {
      for (let k = 0; k < readDays['Tuesday'].length; k++) {
        if (sortTimesTuesday[i] === readDays['Tuesday'][k].start_time) {
          for (let j = 0; j < weeks.length; j++) {
            if (weeks[j] === readDays['Tuesday'][k].week) {
              $('#week' + weeks[j] + ' #tuesday').append('<div class="lesson"><div class="sideColor" style="background:' + readDays['Tuesday'][k].bgColor + '"></div><i id="Tuesday-' + k + '" class="icon-garbage deleteItem"></i><i id="Tuesday-' + k + '" class="icon-edit editItem"></i><p id="time">' + readDays['Tuesday'][k].start_time + '-' + readDays['Tuesday'][k].finish_time + '</p><p id="className">' + readDays['Tuesday'][k].lesson_name + '</p><p id="teacherName">' + readDays['Tuesday'][k].teacher_name + '</p><p id="classRoom">' + readDays['Tuesday'][k].class_room + '</p></div>')
              delete readDays['Tuesday'][k].start_time
              break
            }
          }
        }
      }
    }
    for (let i = 0; i < sortTimesWednesday.length; i++) {
      for (let k = 0; k < readDays['Wednesday'].length; k++) {
        if (sortTimesWednesday[i] === readDays['Wednesday'][k].start_time) {
          for (let j = 0; j < weeks.length; j++) {
            if (weeks[j] === readDays['Wednesday'][k].week) {
              $('#week' + weeks[j] + ' #wednesday').append('<div class="lesson"><div class="sideColor" style="background:' + readDays['Wednesday'][k].bgColor + '"></div><i id="Wednesday-' + k + '" class="icon-garbage deleteItem"></i><i id="Wednesday-' + k + '" class="icon-edit editItem"></i><p id="time">' + readDays['Wednesday'][k].start_time + '-' + readDays['Wednesday'][k].finish_time + '</p><p id="className">' + readDays['Wednesday'][k].lesson_name + '</p><p id="teacherName">' + readDays['Wednesday'][k].teacher_name + '</p><p id="classRoom">' + readDays['Wednesday'][k].class_room + '</p></div>')
              delete readDays['Wednesday'][k].start_time
              break
            }
          }
        }
      }
    }
    for (let i = 0; i < sortTimesThursday.length; i++) {
      for (let k = 0; k < readDays['Thursday'].length; k++) {
        if (sortTimesThursday[i] === readDays['Thursday'][k].start_time) {
          for (let j = 0; j < weeks.length; j++) {
            if (weeks[j] === readDays['Thursday'][k].week) {
              $('#week' + weeks[j] + ' #thursday').append('<div class="lesson"><div class="sideColor" style="background:' + readDays['Thursday'][k].bgColor + '"></div><i id="Thursday-' + k + '" class="icon-garbage deleteItem"></i><i id="Thursday-' + k + '" class="icon-edit editItem"></i><p id="time">' + readDays['Thursday'][k].start_time + '-' + readDays['Thursday'][k].finish_time + '</p><p id="className">' + readDays['Thursday'][k].lesson_name + '</p><p id="teacherName">' + readDays['Thursday'][k].teacher_name + '</p><p id="classRoom">' + readDays['Thursday'][k].class_room + '</p></div>')
              delete readDays['Thursday'][k].start_time
              break
            }
          }
        }
      }
    }
    for (let i = 0; i < sortTimesFriday.length; i++) {
      for (let k = 0; k < readDays['Friday'].length; k++) {
        if (sortTimesFriday[i] === readDays['Friday'][k].start_time) {
          for (let j = 0; j < weeks.length; j++) {
            if (weeks[j] === readDays['Friday'][k].week) {
              $('#week' + weeks[j] + ' #friday').append('<div class="lesson"><div class="sideColor" style="background:' + readDays['Friday'][k].bgColor + '"></div><i id="Friday-' + k + '" class="icon-garbage deleteItem"></i><i id="Friday-' + k + '" class="icon-edit editItem"></i><p id="time">' + readDays['Friday'][k].start_time + '-' + readDays['Friday'][k].finish_time + '</p><p id="className">' + readDays['Friday'][k].lesson_name + '</p><p id="teacherName">' + readDays['Friday'][k].teacher_name + '</p><p id="classRoom">' + readDays['Friday'][k].class_room + '</p></div>')
              delete readDays['Friday'][k].start_time
              break
            }
          }
        }
      }
    }
    for (let i = 0; i < sortTimesSaturday.length; i++) {
      for (let k = 0; k < readDays['Saturday'].length; k++) {
        if (sortTimesSaturday[i] === readDays['Saturday'][k].start_time) {
          for (let j = 0; j < weeks.length; j++) {
            if (weeks[j] === readDays['Saturday'][k].week) {
              $('#week' + weeks[j] + ' #saturday').append('<div class="lesson" style="background:' + readDays['Saturday'][k].bgColor + '"><i id="Saturday-' + k + '" class="icon-garbage deleteItem"></i><i id="Saturday-' + k + '" class="icon-edit editItem"></i><p id="time">' + readDays['Saturday'][k].start_time + '-' + readDays['Saturday'][k].finish_time + '</p><p id="className">' + readDays['Saturday'][k].lesson_name + '</p><p id="teacherName">' + readDays['Saturday'][k].teacher_name + '</p><p id="classRoom">' + readDays['Saturday'][k].class_room + '</p></div>')
              delete readDays['Saturday'][k].start_time
              break
            }
          }
        }
      }
    }
    for (let i = 0; i < sortTimesSunday.length; i++) {
      for (let k = 0; k < readDays['Sunday'].length; k++) {
        if (sortTimesSunday[i] === readDays['Sunday'][k].start_time) {
          for (let j = 0; j < weeks.length; j++) {
            if (weeks[j] === readDays['Sunday'][k].week) {
              $('#week' + weeks[j] + ' #sunday').append('<div class="lesson" style="background:' + readDays['Sunday'][k].bgColor + '"><i id="Sunday-' + k + '" class="icon-garbage deleteItem"></i><i id="Sunday-' + k + '" class="icon-edit editItem"></i><p id="time">' + readDays['Sunday'][k].start_time + '-' + readDays['Sunday'][k].finish_time + '</p><p id="className">' + readDays['Sunday'][k].lesson_name + '</p><p id="teacherName">' + readDays['Sunday'][k].teacher_name + '</p><p id="classRoom">' + readDays['Sunday'][k].class_room + '</p></div>')
              delete readDays['Sunday'][k].start_time
              break
            }
          }
        }
      }
    }

    for (let i = 0; i < weeks.length; i++) {
      $('#week' + weeks[i]).css('display', 'none')
    }
    if (currentWeekIndex == null) {
      $('#week' + weeks[0]).css('display', 'block')
      if (weeks[0] == null) {
        $('.selectedWeek').text('No lessons to load').css('font-size', '16px')
      } else {
        $('.selectedWeek').text('Week ' + weeks[0]).css('font-size', '20px')
      }
    } else {
      $('#week' + currentWeekIndex).css('display', 'block')
      $('.selectedWeek').text('Week ' + currentWeekIndex).css('font-size', '20px')
    }
  })

  let date = new Date()
  let dayNum = date.getDay()

  if(dayNum == 0)
    $('#day0').css('color','#00FF88')
  if(dayNum == 1)
    $('#day1').css('color','#00FF88')
  if(dayNum == 2)
    $('#day2').css('color','#00FF88')
  if(dayNum == 3)
    $('#day3').css('color','#00FF88')
  if(dayNum == 4)
    $('#day4').css('color','#00FF88')
  if(dayNum == 5)
    $('#day5').css('color','#00FF88')
  if(dayNum == 6)
    $('#day6').css('color','#00FF88')

}

$(document).ready(function () {
  readData()
})

/// /////////////////////////////////////////////////////////////////////////////
/// //////////////////////       ADD NEW LESSON        //////////////////////////
/// /////////////////////////////////////////////////////////////////////////////

$('.addBTN').on('click', () => {
  $('.addLessonOverlay').css('display', 'block')
  $('.addLessonOverlay').animate({
    'opacity': '1'
  }, 400)
})

$('.addNewLesson').on('click', () => {

  let startTimeH
  let startTimeMM
  let finishTimeH
  let finishTimeMM
  let lessonName
  let teacherName
  let classRoom
  let week
  let day
  let bgColor

  let allowStartTimeH = true
  let allowStartTimeMM = true
  let allowFinishTimeH = true
  let allowFinishTimeMM = true
  let allowLessonName = true
  let allowTeacherName = true
  let allowClassRoom = true
  let allowWeek = true
  let allowDay = true

  if ($('#start_time_h').val() === null) {
    $('#start_time_h').css('border', '1px solid #DB2B39')
    allowStartTimeH = false
  } else {
    startTimeH = $('#start_time_h').val()
    allowStartTimeH = true
  }
  if ($('#start_time_mm').val() === null) {
    $('#start_time_mm').css('border', '1px solid #DB2B39')
    allowStartTimeMM = false
  } else {
    startTimeMM = $('#start_time_mm').val()
    allowStartTimeMM = true
  }
  if ($('#finish_time_h').val() === null) {
    $('#finish_time_h').css('border', '1px solid #DB2B39')
    allowFinishTimeH = false
  } else {
    finishTimeH = $('#finish_time_h').val()
    allowFinishTimeH = true
  }
  if ($('#finish_time_mm').val() === null) {
    $('#finish_time_mm').css('border', '1px solid #DB2B39')
    allowFinishTimeMM = false
  } else {
    finishTimeMM = $('#finish_time_mm').val()
    allowFinishTimeMM = true
  }
  if ($('#lesson_name').val() === '') {
    $('#lesson_name').css('border', '1px solid #DB2B39')
    allowLessonName = false
  } else {
    lessonName = $('#lesson_name').val()
    allowLessonName = true
  }
  if ($('#teacher_name').val() === '') {
    teacherName = ''
    allowTeacherName = true
  } else {
    teacherName = $('#teacher_name').val()
    allowTeacherName = true
  }
  if ($('#class_room').val() === '') {
    $('#class_room').css('border', '1px solid #DB2B39')
    allowClassRoom = false
  } else {
    classRoom = $('#class_room').val()
    allowClassRoom = true
  }
  if ($('#week').val() === '') {
    $('#week').css('border', '1px solid #DB2B39')
    allowWeek = false
  } else {
    week = $('#week').val()
    allowWeek = true
  }
  if ($('#day').val() === null) {
    $('#day').css('border', '1px solid #DB2B39')
    allowDay = false
  } else {
    day = $('#day').val()
    allowDay = true
  }
  if ($('#bgColor').val() === '') {
    bgColor = '#00FF88'
  } else {
    bgColor = $('#bgColor').val()
  }

  $('#start_time_h').focus(function () {
    $(this).css('border', '1px solid white')
  })
  $('#start_time_mm').focus(function () {
    $(this).css('border', '1px solid white')
  })
  $('#finish_time_h').focus(function () {
    $(this).css('border', '1px solid white')
  })
  $('#finish_time_mm').focus(function () {
    $(this).css('border', '1px solid white')
  })
  $('#lesson_name').focus(function () {
    $(this).css('border', '1px solid white')
  })
  $('#teacher_name').focus(function () {
    $(this).css('border', '1px solid white')
  })
  $('#class_room').focus(function () {
    $(this).css('border', '1px solid white')
  })
  $('#week').focus(function () {
    $(this).css('border', '1px solid white')
  })
  $('#day').focus(function () {
    $(this).css('border', '1px solid white')
  })
  $('#bgColor').focus(function () {
    $(this).css('border', '1px solid white')
  })

  if (!allowStartTimeH || !allowStartTimeMM || !allowFinishTimeH || !allowFinishTimeMM || !allowLessonName || !allowTeacherName || !allowClassRoom || !allowWeek || !allowDay) {
    return
  }

  let startTime = startTimeH + ':' + startTimeMM
  let finishTime = finishTimeH + ':' + finishTimeMM

  let newObj = {start_time: startTime, finish_time: finishTime, lesson_name: lessonName, teacher_name: teacherName, class_room: classRoom, week: week, bgColor: bgColor}

  add3(day, newObj)
  fs.writeFile(app.getPath('userData') + '/settings.json', JSON.stringify(readDaysWrite), () => {
  })

  $('#start_time_h').val('1')
  $('#start_time_mm').val('00')
  $('#finish_time_h').val('1')
  $('#finish_time_mm').val('00')
  $('#lesson_name').val('')
  $('#teacher_name').val('')
  $('#class_room').val('')
  $('#week').val('')
  $('#day').val('Day')
  $('#bgColor').val('')

  $('.addLessonOverlay').animate({
    'opacity': '0'
  }, 400)

  setTimeout(function () {
    $('.addLessonOverlay').css('display', 'none')
  }, 400)

  readData() // -> Refresh table
})

////////////////////////////////////////////////////////////////////////////////
/////////////////////////        CHANGE WEEK          //////////////////////////
////////////////////////////////////////////////////////////////////////////////

$('body').on('click', '#weeks li', (event) => {
  var weekID = event.target.id

  for (let i = 0; i < weeks.length; i++) {
    $('#week' + weeks[i]).css('display', 'none')
  }

  $('#week' + weekID).css('display', 'block')
  $('.selectedWeek').text('Week ' + weekID).css('font-size', '20px')
  currentWeekIndex = weekID
})

////////////////////////////////////////////////////////////////////////////////
/////////////////////////        EDIT LESSON          //////////////////////////
////////////////////////////////////////////////////////////////////////////////

$('body').on('click', '.editItem', (event) => {
  $('.editLessonOverlay').css('display', 'block')
  $('.editLessonOverlay').animate({
    'opacity': '1'
  }, 400)

  clickedId = event.target.id.split('-')

  let startTime = readDaysWrite[clickedId[0]][clickedId[1]].start_time
  let startTimeSplitted = startTime.split(':')
  let startTimeH = startTimeSplitted[0]
  let startTimeMM = startTimeSplitted[1]

  let finishTime = readDaysWrite[clickedId[0]][clickedId[1]].finish_time
  let finishTimeSplitted = finishTime.split(':')
  let finishTimeH = finishTimeSplitted[0]
  let finishTimeMM = finishTimeSplitted[1]

  $('.editLessonOverlay .innerBox #start_time_h').val(startTimeH)
  $('.editLessonOverlay .innerBox #start_time_mm').val(startTimeMM)
  $('.editLessonOverlay .innerBox #finish_time_h').val(finishTimeH)
  $('.editLessonOverlay .innerBox #finish_time_mm').val(finishTimeMM)
  $('.editLessonOverlay .innerBox #lesson_name').val(readDaysWrite[clickedId[0]][clickedId[1]].lesson_name)
  $('.editLessonOverlay .innerBox #teacher_name').val(readDaysWrite[clickedId[0]][clickedId[1]].teacher_name)
  $('.editLessonOverlay .innerBox #class_room').val(readDaysWrite[clickedId[0]][clickedId[1]].class_room)
  $('.editLessonOverlay .innerBox #week').val(readDaysWrite[clickedId[0]][clickedId[1]].week)
  $('.editLessonOverlay .innerBox #day').val(readDaysWrite[clickedId[0]][clickedId[1]].day)
  $('.editLessonOverlay .innerBox #bgColor').val(readDaysWrite[clickedId[0]][clickedId[1]].bgColor)
})

$('.editLesson').on('click', '', function (event) {
  let startTimeH = $('.editLessonOverlay .innerBox #start_time_h').val()
  let startTimeMM = $('.editLessonOverlay .innerBox #start_time_mm').val()
  let finishTimeH = $('.editLessonOverlay .innerBox #finish_time_h').val()
  let finishTimeMM = $('.editLessonOverlay .innerBox #finish_time_mm').val()
  let lessonName = $('.editLessonOverlay .innerBox #lesson_name').val()
  let teacherName = $('.editLessonOverlay .innerBox #teacher_name').val()
  let classRoom = $('.editLessonOverlay .innerBox #class_room').val()
  let week = $('.editLessonOverlay .innerBox #week').val()
  let bgColor = $('.editLessonOverlay .innerBox #bgColor').val()

  let startTime = startTimeH + ':' + startTimeMM
  let finishTime = finishTimeH + ':' + finishTimeMM

  readDaysWrite[clickedId[0]][clickedId[1]].start_time = startTime
  readDaysWrite[clickedId[0]][clickedId[1]].finish_time = finishTime
  readDaysWrite[clickedId[0]][clickedId[1]].lesson_name = lessonName
  readDaysWrite[clickedId[0]][clickedId[1]].teacher_name = teacherName
  readDaysWrite[clickedId[0]][clickedId[1]].class_room = classRoom
  readDaysWrite[clickedId[0]][clickedId[1]].week = week
  readDaysWrite[clickedId[0]][clickedId[1]].bgColor = bgColor

  fs.writeFile(app.getPath('userData') + '/settings.json', JSON.stringify(readDaysWrite), () => {
  })

  $('.editLessonOverlay').animate({
    'opacity': '0'
  }, 400)

  setTimeout(function () {
    $('.editLessonOverlay').css('display', 'none')
  }, 400)

  canEdit = false
  $('.editBTN i').css('color', 'white')

  readData()
})

////////////////////////////////////////////////////////////////////////////////
/////////////////////////       DELETE LESSON        ///////////////////////////
////////////////////////////////////////////////////////////////////////////////

$('body').on('click', '.deleteItem', (event) => {
  let clickedId = event.target.id.split('-')
  delete readDaysWrite[clickedId[0]][parseInt(clickedId[1])]
  readDaysWrite[clickedId[0]].copyWithin(parseInt(clickedId[1]), parseInt(clickedId[1]) + 1, readDaysWrite[clickedId[0]].length)
  readDaysWrite[clickedId[0]].pop()

  fs.writeFile(app.getPath('userData') + '/settings.json', JSON.stringify(readDaysWrite), () => {
  })
  canDelete = false
  $('.deleteBTN i').css('color', 'white')

  readData()
})

////////////////////////////////////////////////////////////////////////////////
//////////////////////////       IMPORT EXPORT        //////////////////////////
////////////////////////////////////////////////////////////////////////////////

$('.importexportBTN').on('click', () => {
  $('.importexportOverlay').css('display', 'block')
  $('.importexportOverlay').animate({
    'opacity': '1'
  }, 400)
})

$(".exportTimetableBTN").click(function() {
  dialog.showOpenDialog({
    properties: ['openDirectory'] }, function (filePath) {
      fs.createReadStream(app.getPath('userData')+'/settings.json').pipe(fs.createWriteStream(filePath+'/settings.json'))
      $('.importexportOverlay').animate({
        'opacity': '0'
      }, 400)

      setTimeout(function () {
        $('.importexportOverlay').css('display', 'none')
      }, 400)
    }
  );
})

$(".importTimetableBTN").click(function() {
  dialog.showOpenDialog({
    properties: ['openFile'] }, function (filePath) {
      let splitted = filePath.toString().split('\\')
      if (splitted[splitted.length-1] === 'settings.json') {
        fs.createReadStream(filePath.toString()).pipe(fs.createWriteStream(app.getPath('userData')+'/settings.json'))
        $('.importexportOverlay .error').html('')
        $('.importexportOverlay').animate({
          'opacity': '0'
        }, 400)

        setTimeout(function () {
          $('.importexportOverlay').css('display', 'none')
        }, 400)
        readData()
      } else {
        $('.importexportOverlay .error').html('Invalid file <span>(Required: settings.json)</span>')
      }
    }
  );
})
