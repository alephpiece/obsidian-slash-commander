/**
 * An stylex-like wrapper of jss.
 */

import type {Classes, Styles, StyleSheet, StyleSheetFactoryOptions} from 'jss';

import jss from 'jss';
import presets from 'jss-preset-default';

type JStyleClasses<Name extends string | number | symbol> = Record<
  Name,
  {
    ruleName: string;
    className: Classes<Name>[Name];
    __rawStyleSheet: StyleSheet<Name>;
  }
>;

jss.setup(presets());

export default function jstyle<Name extends string | number | symbol>(
  jstyleClass: JStyleClasses<Name>[Name],
  data?: Record<string, unknown>,
): Classes<Name>[Name] {
  const {ruleName, className, __rawStyleSheet: sheet} = jstyleClass;

  if (data) {
    sheet.update(ruleName, data);
  }

  return className;
}

jstyle.create = function <Name extends string | number | symbol>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: Partial<Styles<Name, any, undefined>>,
  options?: StyleSheetFactoryOptions,
): JStyleClasses<Name> {
  const styleSheet = jss.createStyleSheet(styles, options).attach();

  const styleSheetRecord = (Object.keys(styleSheet.classes) as Name[]).reduce(
    (res, name) => {
      (res as JStyleClasses<Name>)[name] = {
        ruleName: name.toString(),
        className: styleSheet.classes[name],
        __rawStyleSheet: styleSheet,
      };

      return res;
    },
    {},
  ) as JStyleClasses<Name>;

  return styleSheetRecord;
};
