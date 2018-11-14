import bss from 'bss'
import classnames from 'classnames'

export default function b (input, ...args) {
    return bss(input).class + ' ' + classnames(...args)
}
