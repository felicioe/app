<?php
declare(strict_types=1);
final class TabularReader {
    public static function read(string $path, string $extension): array {
        if ($extension==='csv') {
            $handle=fopen($path,'rb'); $sample=fgets($handle); rewind($handle);
            $delimiter=substr_count($sample?:'',';')>substr_count($sample?:'',',')?';':',';
            $rows=[];
            while (($row=fgetcsv($handle,0,$delimiter,'"',''))!==false) { $rows[]=$row; if (count($rows)>5001) throw new HttpError(422,'Limite de 5000 linhas.'); }
            fclose($handle);
        } elseif ($extension==='xlsx') {
            if (!class_exists('ZipArchive')) throw new HttpError(503,'Extensão zip necessária para XLSX.');
            $zip=new ZipArchive(); if ($zip->open($path)!==true) throw new HttpError(422,'XLSX inválido.');
            $total=0;
            for ($i=0;$i<$zip->numFiles;$i++) { $stat=$zip->statIndex($i); $total+=$stat['size']; if ($total>32*1024*1024) throw new HttpError(422,'XLSX descompactado muito grande.'); }
            $strings=[];
            $shared=$zip->getFromName('xl/sharedStrings.xml');
            if ($shared!==false) foreach (self::xml($shared)->xpath('//*[local-name()="si"]') as $si) { $text=''; foreach ($si->xpath('.//*[local-name()="t"]') as $t) $text.=(string)$t; $strings[]=$text; }
            $sheet=$zip->getFromName('xl/worksheets/sheet1.xml'); if ($sheet===false) throw new HttpError(422,'Primeira planilha ausente.');
            $rows=[];
            foreach (self::xml($sheet)->xpath('//*[local-name()="sheetData"]/*[local-name()="row"]') as $row) {
                $values=[];
                foreach ($row->children('http://schemas.openxmlformats.org/spreadsheetml/2006/main') as $cell) {
                    preg_match('/^([A-Z]+)/',(string)$cell['r'],$m); $index=0; foreach (str_split($m[1]??'A') as $char) $index=$index*26+ord($char)-64;
                    if ($index>100) throw new HttpError(422,'Máximo de 100 colunas.');
                    $nodes=$cell->xpath('./*[local-name()="v"]'); $value=(string)($nodes[0]??'');
                    if ((string)$cell['t']==='s') $value=$strings[(int)$value]??'';
                    if ((string)$cell['t']==='inlineStr') { $value=''; foreach ($cell->xpath('.//*[local-name()="t"]') as $t) $value.=(string)$t; }
                    $values[$index-1]=$value;
                }
                if ($values) { $dense=array_fill(0,max(array_keys($values))+1,''); foreach ($values as $i=>$v) $dense[$i]=$v; $rows[]=$dense; }
                if (count($rows)>5001) throw new HttpError(422,'Limite de 5000 linhas.');
            }
            $zip->close();
        } else throw new HttpError(422,'Use CSV ou XLSX.');
        $headers=array_shift($rows); if (!$headers) throw new HttpError(422,'Arquivo vazio.');
        $headers=array_map(fn($v)=>trim(preg_replace('/^\xEF\xBB\xBF/','',(string)$v)),$headers);
        if (count(array_unique($headers))!==count($headers) || in_array('',$headers,true)) throw new HttpError(422,'Cabeçalhos vazios ou duplicados.');
        $result=[];
        foreach ($rows as $row) { if (count($row)===1 && ($row[0]===null || $row[0]==='')) continue; if (count($row)>count($headers)) throw new HttpError(422,'Linha com colunas excedentes.'); $result[]=array_combine($headers,array_pad($row,count($headers),'')); }
        return $result;
    }
    private static function xml(string $text): SimpleXMLElement {
        if (stripos($text,'<!DOCTYPE')!==false || stripos($text,'<!ENTITY')!==false) throw new HttpError(422,'XML não permitido.');
        $xml=simplexml_load_string($text,SimpleXMLElement::class,LIBXML_NONET|LIBXML_NOERROR|LIBXML_NOWARNING);
        if (!$xml) throw new HttpError(422,'XML inválido.'); return $xml;
    }
}
