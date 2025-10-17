
import bear from "@/public/avatars/bear.png"
import boy from "@/public/avatars/boy.png"
import boyPurple from "@/public/avatars/boy-purple.png"
import cat from "@/public/avatars/cat.png"
import catred from "@/public/avatars/catred.png"
import girl from "@/public/avatars/girl.png"
import hackerBlue from "@/public/avatars/hacker-blue.png"
import manRed from "@/public/avatars/man-red.png"
import womanRed from "@/public/avatars/woman-red.png"
import womanBrownHair from "@/public/avatars/woman-brow-hair.png"
import womanGirlYellow from "@/public/avatars/womanGirl.png"
import chinaGirl from "@/public/avatars/ChinaGirl.png"
import yellowGirl from "@/public/avatars/yellowgirl.png"
import skyBoy from "@/public/avatars/skyboy.png"
import simpleman from "@/public/avatars/simpleman.png"
import rabbit from "@/public/avatars/rabbit.png"
import meerkat from "@/public/avatars/meerkat.png"
import glassboy from "@/public/avatars/glassboy.png"
import dog from "@/public/avatars/dog.png"
import dragon from "@/public/avatars/dragon.png"
import girlEly from "@/public/avatars/girlEly.png"
import bella from "@/public/avatars/bella.png"
import cool from "@/public/avatars/cool.png"
import smallboy from "@/public/avatars/smallboy.png"
import cow from "@/public/avatars/cow.png"
import gamer from "@/public/avatars/gamer.png"
import puffer_fish from "@/public/avatars/puffer-fish.png"
import ninja from "@/public/avatars/ninja.png"
import fox from "@/public/avatars/fox.png"
import wolf from "@/public/avatars/wolf.png"
import han from "@/public/avatars/han.png"
import graywolf from "@/public/avatars/graywolf.png"
import alien from "@/public/avatars/alien.png"
import employee from "@/public/avatars/employee.png"
import ostrich from "@/public/avatars/ostrich.png"
import robotaly from "@/public/avatars/robotaly.png"
import blueman from "@/public/avatars/blueman.png"
import actor from "@/public/avatars/actor.png"
import rocker from "@/public/avatars/rocker.png"
import astronaut from "@/public/avatars/astronaut.png"
import ceo from "@/public/avatars/ceo.png"
import coolboy from "@/public/avatars/coolboy.png"
import programmer from "@/public/avatars/programmer.png"
import teacher from "@/public/avatars/teacher.png"
import taxinspector from "@/public/avatars/taxinspector.png"
import arabian from "@/public/avatars/arabian.png"
import bunny from "@/public/avatars/bunny.png"
import lemur from "@/public/avatars/lemur.png"
import ghost from "@/public/avatars/ghost.png"
import teachergirl from "@/public/avatars/teachergirl.png"
import freshman from "@/public/avatars/freshman.png"

export const staticAvatars = {
    bear,
    boy,
    boyPurple,
    cat,
    catred,
    girl,
    hackerBlue,
    manRed,
    womanRed,
    ghost,
    womanBrownHair,
    womanGirlYellow,
    chinaGirl,
    yellowGirl,
    skyBoy,
    simpleman,
    rabbit,
    meerkat,
    glassboy,
    dog,
    dragon,
    girlEly,
    bella,
    cool,
    smallboy,
    cow,
    gamer,
    puffer_fish,
    fox,
    ninja,
    wolf,
    graywolf,
    han,
    alien,
    employee,
    ostrich,
    robotaly,
    blueman,
    actor,
    rocker,
    astronaut,
    ceo,
    coolboy,
    programmer,
    teacher,
    taxinspector,
    arabian,
    bunny,
    lemur,
    teachergirl,
    freshman,
}

export const avatarList = Object.entries(staticAvatars).map(([key, src]) => ({
    name: key,
    src,
}))
